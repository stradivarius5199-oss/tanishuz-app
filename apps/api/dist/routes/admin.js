"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = adminRoutes;
const db_1 = require("@sparks-uz/db");
async function adminRoutes(app) {
    // Middleware ?>? ???'????
    app.addHook('preHandler', async (request, reply) => {
        // 1. ???'??? '???
        await app.authenticate(request, reply);
        // 2. ???'??? isAdmin
        const { id } = request.user;
        const user = await db_1.prisma.user.findUnique({ where: { id } });
        if (!user || (!user.isAdmin && user.role !== 'ADMIN')) {
            return reply.code(403).send({ error: 'Доступ запрещен' });
        }
    });
    // GET /api/admin/stats
    app.get('/stats', async (request, reply) => {
        const [totalUsers, totalMatches, totalMessages, totalLikes, bannedUsers, totalPhotos, maleProfiles, femaleProfiles] = await db_1.prisma.$transaction([
            db_1.prisma.user.count(),
            db_1.prisma.match.count(),
            db_1.prisma.message.count(),
            db_1.prisma.like.count(),
            db_1.prisma.user.count({ where: { isBanned: true } }),
            db_1.prisma.photo.count(),
            db_1.prisma.profile.count({ where: { gender: 'MALE' } }),
            db_1.prisma.profile.count({ where: { gender: 'FEMALE' } })
        ]);
        return reply.send({
            totalUsers,
            totalMatches,
            totalMessages,
            totalLikes,
            bannedUsers,
            totalPhotos,
            maleProfiles,
            femaleProfiles
        });
    });
    // GET /api/admin/users
    app.get('/users', async (request, reply) => {
        const users = await db_1.prisma.user.findMany({
            include: {
                profile: {
                    select: { name: true, city: true, isComplete: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return reply.send({ users });
    });
    // POST /api/admin/users/:id/ban
    app.post('/users/:id/ban', async (request, reply) => {
        const { id } = request.params;
        const user = await db_1.prisma.user.findUnique({ where: { id } });
        if (!user) {
            return reply.code(404).send({ error: 'Пользователь не найден' });
        }
        const updated = await db_1.prisma.user.update({
            where: { id },
            data: { isBanned: !user.isBanned }
        });
        return reply.send({ user: updated });
    });
}
//# sourceMappingURL=admin.js.map