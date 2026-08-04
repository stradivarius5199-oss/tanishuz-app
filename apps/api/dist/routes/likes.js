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
}
//# sourceMappingURL=likes.js.map