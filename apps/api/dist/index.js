"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const auth_1 = require("./routes/auth");
const profiles_1 = require("./routes/profiles");
const likes_1 = require("./routes/likes");
const matches_1 = require("./routes/matches");
const upload_1 = require("./routes/upload");
const health_1 = require("./routes/health");
const admin_1 = require("./routes/admin");
const socket_1 = require("./socket");
const app = (0, fastify_1.default)({
    logger: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty' }
            : undefined,
    },
});
async function bootstrap() {
    // ── Плагины безопасности ──
    await app.register(helmet_1.default, {
        contentSecurityPolicy: false,
    });
    await app.register(cors_1.default, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
        credentials: true,
    });
    await app.register(multipart_1.default, {
        limits: { fileSize: 10 * 1024 * 1024 } // 10MB
    });
    await app.register(rate_limit_1.default, {
        max: 100,
        timeWindow: '1 minute',
    });
    // ── JWT ──
    await app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET,
    });
    // ── Декоратор для проверки токена ──
    app.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.code(401).send({ error: 'Unauthorized', message: 'Требуется авторизация' });
        }
    });
    // ── Роуты ──
    await app.register(health_1.healthRoutes, { prefix: '/api' });
    await app.register(auth_1.authRoutes, { prefix: '/api/auth' });
    await app.register(profiles_1.profileRoutes, { prefix: '/api/profiles' });
    await app.register(likes_1.likeRoutes, { prefix: '/api/likes' });
    await app.register(matches_1.matchRoutes, { prefix: '/api/matches' });
    await app.register(upload_1.uploadRoutes, { prefix: '/api/upload' });
    await app.register(admin_1.adminRoutes, { prefix: '/api/admin' });
    // ── 404 handler ──
    app.setNotFoundHandler((request, reply) => {
        reply.code(404).send({
            error: 'Not Found',
            message: `Маршрут ${request.method} ${request.url} не найден`,
        });
    });
    // ── Error handler ──
    app.setErrorHandler((error, request, reply) => {
        app.log.error(error);
        const statusCode = error.statusCode ?? 500;
        reply.code(statusCode).send({
            error: error.name,
            message: error.message,
            statusCode,
        });
    });
    // Настраиваем Socket.io
    (0, socket_1.setupSocketIO)(app);
    const port = parseInt(process.env.PORT ?? '4000');
    const host = process.env.HOST ?? '0.0.0.0';
    // ВАЖНО: app.ready() нужно для инициализации плагинов до старта сокетов
    await app.ready();
    await app.listen({ port, host });
    app.log.info(`🔥 Tanishuz API запущен на http://${host}:${port}`);
}
bootstrap().catch((err) => {
    console.error('Ошибка запуска сервера:', err);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map