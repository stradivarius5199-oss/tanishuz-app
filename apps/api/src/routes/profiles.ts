import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@sparks-uz/db';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  goal: z.enum(['FRIENDSHIP', 'RELATIONSHIP', 'MARRIAGE']).optional(),
  city: z.string().max(100).optional(),
  cityUz: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  bioRu: z.string().max(500).optional(),
  bioUz: z.string().max(500).optional(),
  bioEn: z.string().max(500).optional(),
  education: z.enum(['SCHOOL','COLLEGE','BACHELOR','MASTER','PHD']).optional(),
  profession: z.string().max(100).optional(),
  religion: z.enum(['ISLAM','CHRISTIAN','OTHER','PREFER_NOT_TO_SAY']).optional(),
  height: z.number().int().min(140).max(220).optional(),
  hasChildren: z.boolean().optional(),
  wantsChildren: z.boolean().optional(),
  interests: z.array(z.string()).max(15).optional(),
  searchGender: z.enum(['MALE', 'FEMALE']).optional(),
  searchAgeMin: z.number().int().min(18).max(80).optional(),
  searchAgeMax: z.number().int().min(18).max(80).optional(),
  searchRadius: z.number().int().min(5).max(500).optional(),
  showDistance: z.boolean().optional(),
  blurPhotos: z.boolean().optional(),
});

export async function profileRoutes(app: FastifyInstance) {

  // ────────────────────────────────────────
  // GET /api/profiles/me
  // ────────────────────────────────────────
  app.get(
    '/me',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { photos: { orderBy: { order: 'asc' } } },
      });
      if (!profile) {
        return reply.code(404).send({ error: 'Profile not found' });
      }
      return reply.send({ profile });
    }
  );

  // ────────────────────────────────────────
  // PATCH /api/profiles/me
  // ────────────────────────────────────────
  app.patch(
    '/me',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;
      const body = updateProfileSchema.safeParse(request.body);
      if (!body.success) {
        return reply.code(400).send({ error: 'Validation Error', issues: body.error.issues });
      }

      const data = body.data;
      // Проверяем заполненность профиля
      const profile = await prisma.profile.update({
        where: { userId },
        data: {
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          updatedAt: new Date(),
        },
        include: { photos: true },
      });

      // Обновляем isComplete
      const isComplete = Boolean(
        profile.name &&
        profile.birthDate &&
        profile.gender &&
        profile.city &&
        (profile.bioRu || profile.bioUz || profile.bioEn) &&
        profile.photos.length > 0
      );

      await prisma.profile.update({
        where: { userId },
        data: { isComplete },
      });

      return reply.send({ profile: { ...profile, isComplete } });
    }
  );

  // ────────────────────────────────────────
  // GET /api/profiles/:id
  // ────────────────────────────────────────
  app.get(
    '/:id',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const profile = await prisma.profile.findUnique({
        where: { id },
        include: {
          photos: {
            where: { isApproved: true },
            orderBy: { order: 'asc' },
          },
        },
      });
      if (!profile) {
        return reply.code(404).send({ error: 'Профиль не найден' });
      }
      // Не возвращаем приватные поля
      const { latitude, longitude, searchGender, searchAgeMin, searchAgeMax, searchRadius, blurPhotos, ...publicProfile } = profile;
      return reply.send({ profile: publicProfile });
    }
  );

  // ────────────────────────────────────────
  // GET /api/profiles/discover
  // Получить кандидатов для свайпа
  // ────────────────────────────────────────
  app.get(
    '/discover',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;
      const { limit = '10' } = request.query as { limit?: string };

      // Получаем профиль текущего пользователя с настройками поиска
      const myProfile = await prisma.profile.findUnique({ where: { userId } });
      if (!myProfile) {
        return reply.code(404).send({ error: 'Сначала заполните профиль' });
      }

      // ID пользователей, которых уже лайкнули или заблокировали
      const alreadyLiked = await prisma.like.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
      });
      const excludeIds = [userId, ...alreadyLiked.map(l => l.toUserId)];

      // Вычисляем возраст для фильтрации
      const now = new Date();
      const maxBirthDate = new Date(now.getFullYear() - myProfile.searchAgeMin, now.getMonth(), now.getDate());
      const minBirthDate = new Date(now.getFullYear() - myProfile.searchAgeMax, now.getMonth(), now.getDate());

      const candidates = await prisma.profile.findMany({
        where: {
          userId: { notIn: excludeIds },
          gender: myProfile.searchGender ?? undefined,
          isComplete: true,
          birthDate: {
            gte: minBirthDate,
            lte: maxBirthDate,
          },
          user: {
            isActive: true,
            isBanned: false,
          },
        },
        include: {
          photos: {
            where: { isApproved: true, isMain: true },
            take: 1,
          },
        },
        orderBy: { lastActive: 'desc' },
        take: parseInt(limit),
      });

      return reply.send({ candidates, total: candidates.length });
    }
  );
}
