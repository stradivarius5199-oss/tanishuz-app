import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@sparks-uz/db';
import { z } from 'zod';

const likeSchema = z.object({
  toUserId: z.string().cuid(),
  type: z.enum(['LIKE', 'SUPER_LIKE']).default('LIKE'),
});

export async function likeRoutes(app: FastifyInstance) {

  // ────────────────────────────────────────
  // POST /api/likes
  // Поставить лайк или суперлайк
  // ────────────────────────────────────────
  app.post(
    '/',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: fromUserId } = (request as any).user;
      const body = likeSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'Validation Error', issues: body.error.issues });
      }

      const { toUserId, type } = body.data;

      if (fromUserId === toUserId) {
        return reply.code(400).send({ error: 'Нельзя лайкнуть себя' });
      }

      // Проверяем: не лайкали ли уже
      const existing = await prisma.like.findUnique({
        where: { fromUserId_toUserId: { fromUserId, toUserId } },
      });
      if (existing) {
        return reply.code(409).send({ error: 'Уже лайкнули этого пользователя' });
      }

      // Создаём лайк
      const like = await prisma.like.create({
        data: { fromUserId, toUserId, type },
      });

      // Обновляем счётчик лайков в профиле
      await prisma.profile.update({
        where: { userId: toUserId },
        data: { likesCount: { increment: 1 } },
      });

      // Проверяем взаимный лайк → создаём Match
      const mutualLike = await prisma.like.findUnique({
        where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: fromUserId } },
      });

      let match = null;
      if (mutualLike && mutualLike.type !== 'DISLIKE') {
        // Убеждаемся в уникальном порядке (userA < userB по алфавиту)
        const [userAId, userBId] = [fromUserId, toUserId].sort();

        match = await prisma.match.upsert({
          where: { userAId_userBId: { userAId, userBId } },
          create: { userAId, userBId },
          update: {},
        });

        // Обновляем счётчики совпадений
        await prisma.profile.updateMany({
          where: { userId: { in: [fromUserId, toUserId] } },
          data: { matchesCount: { increment: 1 } },
        });
      }

      return reply.code(201).send({
        like,
        isMatch: !!match,
        match,
      });
    }
  );

  // ────────────────────────────────────────
  // DELETE /api/likes/:toUserId
  // Дизлайк / пропуск (NOPE)
  // ────────────────────────────────────────
  app.delete(
    '/:toUserId',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: fromUserId } = (request as any).user;
      const { toUserId } = request.params as { toUserId: string };

      // Создаём запись "DISLIKE", чтобы исключить пользователя из будущей выдачи
      await prisma.like.upsert({
        where: { fromUserId_toUserId: { fromUserId, toUserId } },
        update: { type: 'DISLIKE' },
        create: { fromUserId, toUserId, type: 'DISLIKE' },
      });

      return reply.send({ message: 'Пропущено' });
    }
  );
}
