import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';

import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profiles';
import { likeRoutes } from './routes/likes';
import { matchRoutes } from './routes/matches';
import { uploadRoutes } from './routes/upload';
import { healthRoutes } from './routes/health';
import { adminRoutes } from './routes/admin';
import { setupSocketIO } from './socket';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
  },
});

async function bootstrap() {
  // ── Плагины безопасности ──
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // ── JWT ──
  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  // ── Декоратор для проверки токена ──
  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Требуется авторизация' });
    }
  });

  // ── Роуты ──
  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(profileRoutes, { prefix: '/api/profiles' });
  await app.register(likeRoutes, { prefix: '/api/likes' });
  await app.register(matchRoutes, { prefix: '/api/matches' });
  await app.register(uploadRoutes, { prefix: '/api/upload' });
  await app.register(adminRoutes, { prefix: '/api/admin' });

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
  setupSocketIO(app);

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

export default app;
