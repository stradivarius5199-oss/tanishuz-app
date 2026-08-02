"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const db_1 = require("@sparks-uz/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const google_auth_library_1 = require("google-auth-library");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID || '387281742438-8lqihf77fcekb4mqtis76tdcfu8npll1.apps.googleusercontent.com');
// ── Validation schemas ──
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Некорректный email'),
    password: zod_1.z
        .string()
        .min(8, 'Пароль минимум 8 символов')
        .max(100),
    name: zod_1.z.string().min(2, 'Имя минимум 2 символа').max(50),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
async function authRoutes(app) {
    // ────────────────────────────────────────
    // POST /api/auth/register
    // ────────────────────────────────────────
    app.post('/register', async (request, reply) => {
        const body = registerSchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(400).send({
                error: 'Validation Error',
                issues: body.error.issues,
            });
        }
        const { email, password, name } = body.data;
        // Проверка: email уже занят?
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return reply.code(409).send({
                error: 'Conflict',
                message: 'Пользователь с таким email уже существует',
            });
        }
        // Хэшируем пароль
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const isAdminEmail = email.toLowerCase() === 'stradivarius5199@gmail.com';
        // Создаём пользователя + профиль
        const user = await db_1.prisma.user.create({
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
    app.post('/login', async (request, reply) => {
        const body = loginSchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(400).send({ error: 'Validation Error', issues: body.error.issues });
        }
        const { email, password } = body.data;
        const user = await db_1.prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        // Защита от timing attack — всегда проверяем хэш
        const passwordValid = user?.passwordHash
            ? await bcryptjs_1.default.compare(password, user.passwordHash)
            : await bcryptjs_1.default.compare(password, '$2b$12$invalid.hash.placeholder');
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
            await db_1.prisma.profile.update({
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
    app.post('/refresh', async (request, reply) => {
        const body = refreshSchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(400).send({ error: 'Validation Error' });
        }
        const tokenRecord = await db_1.prisma.refreshToken.findUnique({
            where: { token: body.data.refreshToken },
            include: { user: true },
        });
        if (!tokenRecord ||
            tokenRecord.isRevoked ||
            tokenRecord.expiresAt < new Date()) {
            return reply.code(401).send({
                error: 'Unauthorized',
                message: 'Недействительный refresh token',
            });
        }
        // Отзываем старый токен (rotation)
        await db_1.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { isRevoked: true },
        });
        const { accessToken, refreshToken } = await generateTokens(app, tokenRecord.userId);
        return reply.send({ accessToken, refreshToken });
    });
    // ────────────────────────────────────────
    // POST /api/auth/logout
    // ────────────────────────────────────────
    app.post('/logout', { preHandler: [app.authenticate] }, async (request, reply) => {
        const body = refreshSchema.safeParse(request.body);
        if (body.success) {
            await db_1.prisma.refreshToken.updateMany({
                where: { token: body.data.refreshToken },
                data: { isRevoked: true },
            });
        }
        return reply.send({ message: 'Выход выполнен' });
    });
    // ────────────────────────────────────────
    // GET /api/auth/me
    // ────────────────────────────────────────
    app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
        const payload = request.user;
        const user = await db_1.prisma.user.findUnique({
            where: { id: payload.id },
            include: { profile: { include: { photos: true } } },
        });
        if (!user) {
            return reply.code(404).send({ error: 'Not Found', message: 'Пользователь не найден' });
        }
        return reply.send({ user: sanitizeUser(user) });
    });
    // ────────────────────────────────────────
    // POST /api/auth/google
    // ────────────────────────────────────────
    app.post('/google', async (request, reply) => {
        try {
            const { idToken } = request.body;
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
            let user = await db_1.prisma.user.findUnique({
                where: { email },
                include: { profile: { include: { photos: true } } },
            });
            if (!user) {
                const isAdminEmail = email === 'stradivarius5199@gmail.com';
                const created = await db_1.prisma.user.create({
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
                    await db_1.prisma.photo.create({
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
            if (user.isBanned) {
                return reply.code(403).send({ error: 'Ваш аккаунт заблокирован' });
            }
            // 3. Выдаём наши JWT токены
            const { accessToken, refreshToken } = await generateTokens(app, user.id);
            return reply.send({
                message: 'Вход через Google выполнен',
                user: sanitizeUser(user),
                accessToken,
                refreshToken,
            });
        }
        catch (err) {
            app.log.error('Google Auth Error: ' + err.message);
            return reply.code(500).send({ error: 'Ошибка авторизации Google: ' + err.message });
        }
    });
}
// ── Helpers ──
async function generateTokens(app, userId) {
    // Access token — 15 минут
    const accessToken = app.jwt.sign({ id: userId }, { expiresIn: '15m' });
    // Refresh token — 30 дней
    const refreshTokenValue = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db_1.prisma.refreshToken.create({
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
function sanitizeUser(user) {
    const { passwordHash, ...safe } = user;
    return safe;
}
//# sourceMappingURL=auth.js.map