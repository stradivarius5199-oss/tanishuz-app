import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@sparks-uz/db';

export async function matchRoutes(app: FastifyInstance) {

  // ────────────────────────────────────────
  // GET /api/matches
  // Получить все совпадения
  // ────────────────────────────────────────
  app.get(
    '/',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;

      const matches = await prisma.match.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
        },
        include: {
          userA: {
            include: {
              profile: {
                include: {
                  photos: { where: { isMain: true }, take: 1 },
                },
              },
            },
          },
          userB: {
            include: {
              profile: {
                include: {
                  photos: { where: { isMain: true }, take: 1 },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // последнее сообщение для превью
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      // Форматируем: возвращаем "другого" пользователя
      const formatted = matches.map((match) => {
        const otherUser = match.userAId === userId ? match.userB : match.userA;
        const isSeen = match.userAId === userId ? match.seenByA : match.seenByB;
        return {
          matchId: match.id,
          createdAt: match.createdAt,
          isSeen,
          partner: {
            id: otherUser.id,
            profile: otherUser.profile,
          },
          lastMessage: match.messages[0] ?? null,
        };
      });

      return reply.send({ matches: formatted });
    }
  );

  // ────────────────────────────────────────
  // GET /api/matches/:matchId/messages
  // Получить сообщения чата
  // ────────────────────────────────────────
  app.get(
    '/:matchId/messages',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;
      const { matchId } = request.params as { matchId: string };
      const { cursor, limit = '30' } = request.query as { cursor?: string; limit?: string };

      // Проверяем принадлежность матча
      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          OR: [{ userAId: userId }, { userBId: userId }],
        },
      });
      if (!match) {
        return reply.code(404).send({ error: 'Совпадение не найдено' });
      }

      const messages = await prisma.message.findMany({
        where: {
          matchId,
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        },
        include: {
          sender: {
            include: { profile: { include: { photos: { where: { isMain: true }, take: 1 } } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });

      // Помечаем как прочитанные
      await prisma.message.updateMany({
        where: {
          matchId,
          senderId: { not: userId },
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return reply.send({
        messages: messages.reverse(),
        nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null,
      });
    }
  );

  // ────────────────────────────────────────
  // POST /api/matches/:matchId/messages
  // Отправить сообщение (HTTP fallback, основное через WS)
  // ────────────────────────────────────────
  app.post(
    '/:matchId/messages',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;
      const { matchId } = request.params as { matchId: string };
      const { text, type = 'TEXT' } = request.body as { text?: string; type?: string };

      const match = await prisma.match.findFirst({
        where: {
          id: matchId,
          OR: [{ userAId: userId }, { userBId: userId }],
        },
      });
      if (!match) {
        return reply.code(404).send({ error: 'Совпадение не найдено' });
      }

      if (!text || text.trim().length === 0) {
        return reply.code(400).send({ error: 'Сообщение не может быть пустым' });
      }

      const message = await prisma.message.create({
        data: {
          matchId,
          senderId: userId,
          text: text.trim(),
          type: type as any,
          deliveredAt: new Date(),
        },
        include: {
          sender: {
            include: { profile: { include: { photos: { where: { isMain: true }, take: 1 } } } },
          },
        },
      });

      // Обновляем updatedAt у матча (для сортировки в списке чатов)
      await prisma.match.update({
        where: { id: matchId },
        data: { updatedAt: new Date() },
      });

      // 🔥 ОТПРАВЛЯЕМ ЧЕРЕЗ SOCKET.IO
      const receiverId = match.userAId === userId ? match.userBId : match.userAId;
      (app as any).io.to(`user_${receiverId}`).emit('new_message', {
        matchId,
        message,
      });

      return reply.code(201).send({ message });
    }
  );
}
