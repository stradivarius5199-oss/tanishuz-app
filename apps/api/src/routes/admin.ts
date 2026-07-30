import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@sparks-uz/db';

export async function adminRoutes(app: FastifyInstance) {
  // Middleware ?>? ???'????
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // 1. ???'??? '???
    await (app as any).authenticate(request, reply);
    
    // 2. ???'??? isAdmin
    const { id } = (request as any).user;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || (!user.isAdmin && user.role !== 'ADMIN')) {
      return reply.code(403).send({ error: 'Доступ запрещен' });
    }
  });

  // GET /api/admin/stats
  app.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      totalUsers,
      totalMatches,
      totalMessages,
      totalLikes,
      bannedUsers,
      totalPhotos,
      maleProfiles,
      femaleProfiles
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.match.count(),
      prisma.message.count(),
      prisma.like.count(),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.photo.count(),
      prisma.profile.count({ where: { gender: 'MALE' } }),
      prisma.profile.count({ where: { gender: 'FEMALE' } })
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
  app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
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
  app.post('/users/:id/ban', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      return reply.code(404).send({ error: 'Пользователь не найден' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: !user.isBanned }
    });

    return reply.send({ user: updated });
  });
}
