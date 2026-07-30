import { FastifyInstance } from 'fastify';
import { prisma } from '@sparks-uz/db';

export async function healthRoutes(app: FastifyInstance) {
  // GET /api/health
  app.get('/health', async (request, reply) => {
    try {
      // Проверяем соединение с БД
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({
        status: 'ok',
        app: 'Tanishuz API',
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (err) {
      return reply.code(503).send({
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });
}
