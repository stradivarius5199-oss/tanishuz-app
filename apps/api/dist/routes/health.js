"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = healthRoutes;
const db_1 = require("@sparks-uz/db");
async function healthRoutes(app) {
    // GET /api/health
    app.get('/health', async (request, reply) => {
        try {
            // Проверяем соединение с БД
            await db_1.prisma.$queryRaw `SELECT 1`;
            return reply.send({
                status: 'ok',
                app: 'Tanishuz API',
                version: '0.1.0',
                timestamp: new Date().toISOString(),
                database: 'connected',
            });
        }
        catch (err) {
            return reply.code(503).send({
                status: 'error',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
            });
        }
    });
}
//# sourceMappingURL=health.js.map