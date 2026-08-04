"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.likeRoutes = likeRoutes;
const db_1 = require("@sparks-uz/db");
const zod_1 = require("zod");
const likeSchema = zod_1.z.object({
    toUserId: zod_1.z.string().cuid(),
    type: zod_1.z.enum(['LIKE', 'SUPER_LIKE']).default('LIKE'),
});
async function likeRoutes(app) {
    // ────────────────────────────────────────
    // POST /api/likes
    // Поставить лайк или суперлайк
    // ────────────────────────────────────────
    app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id: fromUserId } = request.user;
        const body = likeSchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(400).send({ error: 'Validation Error', issues: body.error.issues });
        }
        const { toUserId, type } = body.data;
        if (fromUserId === toUserId) {
            return reply.code(400).send({ error: 'Нельзя лайкнуть себя' });
        }
        // Проверяем: не лайкали ли уже
        const existing = await db_1.prisma.like.findUnique({
            where: { fromUserId_toUserId: { fromUserId, toUserId } },
        });
        if (existing) {
            return reply.code(409).send({ error: 'Уже лайкнули этого пользователя' });
        }
        // Создаём лайк
        const like = await db_1.prisma.like.create({
            data: { fromUserId, toUserId, type },
        });
        // Обновляем счётчик лайков в профиле
        await db_1.prisma.profile.update({
            where: { userId: toUserId },
            data: { likesCount: { increment: 1 } },
        });
        // Проверяем взаимный лайк → создаём Match
        const mutualLike = await db_1.prisma.like.findUnique({
            where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
        });
        let match = null;
        if (mutualLike && mutualLike.type !== 'DISLIKE') {
            // Убеждаемся в уникальном порядке (userA < userB по алфавиту)
            const [userAId, userBId] = [fromUserId, toUserId].sort();
            match = await db_1.prisma.match.upsert({
                where: { userAId_userBId: { userAId, userBId } },
                create: { userAId, userBId },
                update: {},
            });
            // Обновляем счётчики совпадений
            await db_1.prisma.profile.updateMany({
                where: { userId: { in: [fromUserId, toUserId] } },
                data: { matchesCount: { increment: 1 } },
            });
        }
        return reply.code(201).send({
            like,
            isMatch: !!match,
            match,
        });
    });
    // ────────────────────────────────────────
    // DELETE /api/likes/:toUserId
    // Дизлайк / пропуск (NOPE)
    // ────────────────────────────────────────
    app.delete('/:toUserId', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id: fromUserId } = request.user;
        const { toUserId } = request.params;
        // Создаём запись "DISLIKE", чтобы исключить пользователя из будущей выдачи
        await db_1.prisma.like.upsert({
            where: { fromUserId_toUserId: { fromUserId, toUserId } },
            update: { type: 'DISLIKE' },
            create: { fromUserId, toUserId, type: 'DISLIKE' },
        });
        return reply.send({ message: 'Пропущено' });
    });
    // ────────────────────────────────────────
    // GET /api/likes/received
    // Получить список тех, кто лайкнул меня (для Premium вкладки)
    // ────────────────────────────────────────
    app.get('/received', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id: userId } = request.user;
        // Получаем всех, кто лайкнул нас
        const receivedLikes = await db_1.prisma.like.findMany({
            where: {
                toUserId: userId,
                type: { in: ['LIKE', 'SUPER_LIKE'] }
            },
            include: {
                fromUser: {
                    include: {
                        profile: {
                            include: {
                                photos: {
                                    where: { isApproved: true, isMain: true },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Получаем наши матчи, чтобы исключить их из списка "Лайков"
        const myMatches = await db_1.prisma.match.findMany({
            where: {
                OR: [{ userAId: userId }, { userBId: userId }]
            }
        });
        const matchUserIds = new Set(myMatches.map(m => m.userAId === userId ? m.userBId : m.userAId));
        // Фильтруем тех, с кем уже есть матч
        const pendingLikes = receivedLikes
            .filter(like => !matchUserIds.has(like.fromUserId) && like.fromUser.profile)
            .map(like => {
            const profile = like.fromUser.profile;
            return {
                userId: like.fromUserId,
                name: profile.name,
                birthDate: profile.birthDate,
                photoUrl: profile.photos[0]?.url || null,
                type: like.type,
                blurPhotos: profile.blurPhotos,
                createdAt: like.createdAt
            };
        });
        return reply.send({ likes: pendingLikes, total: pendingLikes.length });
    });
}
//# sourceMappingURL=likes.js.map