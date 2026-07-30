import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@sparks-uz/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// ── Validation schemas ──
const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Пароль минимум 8 символов')
    .max(100),
  name: z.string().min(2, 'Имя минимум 2 символа').max(50),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // ────────────────────────────────────────
  // POST /api/auth/register
  // ────────────────────────────────────────
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        error: 'Validation Error',
        issues: body.error.issues,
      });
    }

    const { email, password, name } = body.data;

    // Проверка: email уже занят?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'Пользователь с таким email уже существует',
      });
    }

    // Хэшируем пароль
    const passwordHash = await bcrypt.hash(password, 12);

    // Создаём пользователя + профиль
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            name,
            gender: 'MALE', // будет обновлено при онбординге
            birthDate: new Date(), // placeholder, обновится при онбординге
            goal: 'RELATIONSHIP',
          },
        },
      },
      include: { profile: true },
    });

    // Генерируем токены
    const { accessToken, refreshToken } = await generateTokens(app, user.id);

    return reply.code(201).send({
      message: 'Регистрация успешна',
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  });

  // ────────────────────────────────────────
  // POST /api/auth/login
  // ────────────────────────────────────────
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation Error', issues: body.error.issues });
    }

    const { email, password } = body.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Защита от timing attack — всегда проверяем хэш
    const passwordValid =
      user?.passwordHash
        ? await bcrypt.compare(password, user.passwordHash)
        : await bcrypt.compare(password, '$2b$12$invalid.hash.placeholder');

    if (!user || !passwordValid) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Неверный email или пароль',
      });
    }

    if (user.isBanned) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Аккаунт заблокирован${user.banReason ? `: ${user.banReason}` : ''}`,
      });
    }

    // Обновляем lastActive
    if (user.profile) {
      await prisma.profile.update({
        where: { userId: user.id },
        data: { lastActive: new Date() },
      });
    }

    const { accessToken, refreshToken } = await generateTokens(app, user.id);

    return reply.send({
      message: 'Вход выполнен',
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  });

  // ────────────────────────────────────────
  // POST /api/auth/refresh
  // ────────────────────────────────────────
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation Error' });
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: body.data.refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.isRevoked ||
      tokenRecord.expiresAt < new Date()
    ) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Недействительный refresh token',
      });
    }

    // Отзываем старый токен (rotation)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const { accessToken, refreshToken } = await generateTokens(app, tokenRecord.userId);

    return reply.send({ accessToken, refreshToken });
  });

  // ────────────────────────────────────────
  // POST /api/auth/logout
  // ────────────────────────────────────────
  app.post(
    '/logout',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = refreshSchema.safeParse(request.body);
      if (body.success) {
        await prisma.refreshToken.updateMany({
          where: { token: body.data.refreshToken },
          data: { isRevoked: true },
        });
      }
      return reply.send({ message: 'Выход выполнен' });
    }
  );

  // ────────────────────────────────────────
  // GET /api/auth/me
  // ────────────────────────────────────────
  app.get(
    '/me',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = (request as any).user as { id: string };
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        include: { profile: { include: { photos: true } } },
      });

      if (!user) {
        return reply.code(404).send({ error: 'Not Found', message: 'Пользователь не найден' });
      }

      return reply.send({ user: sanitizeUser(user) });
    }
  );
}

// ── Helpers ──

async function generateTokens(app: FastifyInstance, userId: string) {
  // Access token — 15 минут
  const accessToken = (app as any).jwt.sign(
    { id: userId },
    { expiresIn: '15m' }
  );

  // Refresh token — 30 дней
  const refreshTokenValue = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshTokenValue,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}
