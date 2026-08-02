import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@sparks-uz/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '387281742438-8lqihf77fcekb4mqtis76tdcfu8npll1.apps.googleusercontent.com');

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
    const hashedPassword = await bcrypt.hash(password, 10);

    const isAdminEmail = email.toLowerCase() === 'stradivarius5199@gmail.com';

    // Создаём пользователя + профиль
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role: isAdminEmail ? 'ADMIN' : 'USER',
        isAdmin: isAdminEmail,
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

  // ────────────────────────────────────────
  // POST /api/auth/google
  // ────────────────────────────────────────
  app.post('/google', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { idToken } = request.body as { idToken: string };

      if (!idToken) {
        return reply.code(400).send({ error: 'idToken is required' });
      }

      // 1. Верифицируем токен через Google
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID || '387281742438-8lqihf77fcekb4mqtis76tdcfu8npll1.apps.googleusercontent.com',
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return reply.code(400).send({ error: 'Invalid Google token' });
      }

      const email = payload.email.toLowerCase();
      const name = payload.name || 'Google User';
      const picture = payload.picture;

      // 2. Ищем или создаём пользователя
      let user = await prisma.user.findUnique({
        where: { email },
        include: { profile: { include: { photos: true } } },
      });

      if (!user) {
        const isAdminEmail = email === 'stradivarius5199@gmail.com';

        const created = await prisma.user.create({
          data: {
            email,
            role: isAdminEmail ? 'ADMIN' : 'USER',
            isAdmin: isAdminEmail,
            profile: {
              create: {
                name,
                gender: 'MALE',
                birthDate: new Date('2000-01-01'),
                bioRu: 'Авторизован через Google',
              },
            },
          },
          include: { profile: { include: { photos: true } } },
        });

        // Сохраняем аватарку из Google
        if (picture && created.profile) {
          await prisma.photo.create({
            data: {
              profileId: created.profile.id,
              url: picture,
              publicId: 'google_avatar',
              isMain: true,
              isApproved: true,
            },
          });
        }

        user = created;
      }

      if (user!.isBanned) {
        return reply.code(403).send({ error: 'Ваш аккаунт заблокирован' });
      }

      // 3. Выдаём наши JWT токены
      const { accessToken, refreshToken } = await generateTokens(app, user!.id);

      return reply.send({
        message: 'Вход через Google выполнен',
        user: sanitizeUser(user!),
        accessToken,
        refreshToken,
      });
    } catch (err: any) {
      app.log.error('Google Auth Error: ' + err.message);
      return reply.code(500).send({ error: 'Ошибка авторизации Google: ' + err.message });
    }
  });

  // ────────────────────────────────────────
  // POST /api/auth/google/callback  (OAuth2 code exchange for Android WebView)
  // ────────────────────────────────────────
  app.post('/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { code, redirectUri } = request.body as { code: string; redirectUri: string };

      if (!code || !redirectUri) {
        return reply.code(400).send({ error: 'code and redirectUri are required' });
      }

      const GOOGLE_CLIENT_ID_VAL = process.env.GOOGLE_CLIENT_ID || '387281742438-8lqihf77fcekb4mqtis76tdcfu8npll1.apps.googleusercontent.com';
      const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

      // 1. Обмениваем code на tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID_VAL,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json() as any;
      if (!tokenData.id_token) {
        return reply.code(400).send({ error: 'Не удалось получить id_token от Google: ' + JSON.stringify(tokenData) });
      }

      // 2. Верифицируем id_token
      const ticket = await googleClient.verifyIdToken({
        idToken: tokenData.id_token,
        audience: GOOGLE_CLIENT_ID_VAL,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return reply.code(400).send({ error: 'Invalid Google token payload' });
      }

      const email = payload.email.toLowerCase();
      const name = payload.name || 'Google User';
      const picture = payload.picture;

      // 3. Ищем или создаём пользователя
      let user = await prisma.user.findUnique({
        where: { email },
        include: { profile: { include: { photos: true } } },
      });

      if (!user) {
        const isAdminEmail = email === 'stradivarius5199@gmail.com';
        const created = await prisma.user.create({
          data: {
            email,
            role: isAdminEmail ? 'ADMIN' : 'USER',
            isAdmin: isAdminEmail,
            profile: {
              create: {
                name,
                gender: 'MALE',
                birthDate: new Date('2000-01-01'),
                bioRu: 'Авторизован через Google',
              },
            },
          },
          include: { profile: { include: { photos: true } } },
        });
        if (picture && created.profile) {
          await prisma.photo.create({
            data: {
              profileId: created.profile.id,
              url: picture,
              publicId: 'google_avatar',
              isMain: true,
              isApproved: true,
            },
          });
        }
        user = created;
      }

      if (user!.isBanned) {
        return reply.code(403).send({ error: 'Ваш аккаунт заблокирован' });
      }

      const { accessToken, refreshToken } = await generateTokens(app, user!.id);

      return reply.send({
        message: 'Вход через Google выполнен',
        user: sanitizeUser(user!),
        accessToken,
        refreshToken,
      });
    } catch (err: any) {
      app.log.error('Google Callback Error: ' + err.message);
      return reply.code(500).send({ error: 'Ошибка Google callback: ' + err.message });
    }
  });
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
