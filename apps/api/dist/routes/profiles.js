"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRoutes = profileRoutes;
const db_1 = require("@sparks-uz/db");
const zod_1 = require("zod");
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50).optional(),
    birthDate: zod_1.z.string().datetime().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE']).optional(),
    goal: zod_1.z.enum(['FRIENDSHIP', 'RELATIONSHIP', 'MARRIAGE']).optional(),
    city: zod_1.z.string().max(100).optional(),
    cityUz: zod_1.z.string().max(100).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    bioRu: zod_1.z.string().max(500).optional(),
    bioUz: zod_1.z.string().max(500).optional(),
    bioEn: zod_1.z.string().max(500).optional(),
    education: zod_1.z.enum(['SCHOOL', 'COLLEGE', 'BACHELOR', 'MASTER', 'PHD']).optional(),
    profession: zod_1.z.string().max(100).optional(),
    religion: zod_1.z.enum(['ISLAM', 'CHRISTIAN', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    height: zod_1.z.number().int().min(140).max(220).optional(),
    hasChildren: zod_1.z.boolean().optional(),
    wantsChildren: zod_1.z.boolean().optional(),
    interests: zod_1.z.array(zod_1.z.string()).max(15).optional(),
    searchGender: zod_1.z.enum(['MALE', 'FEMALE']).optional(),
    searchAgeMin: zod_1.z.number().int().min(18).max(80).optional(),
    searchAgeMax: zod_1.z.number().int().min(18).max(80).optional(),
    searchRadius: zod_1.z.number().int().min(5).max(500).optional(),
    showDistance: zod_1.z.boolean().optional(),
    blurPhotos: zod_1.z.boolean().optional(),
});
async function profileRoutes(app) {
    // ────────────────────────────────────────
    // GET /api/profiles/me
    // ────────────────────────────────────────
    app.get('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id: userId } = request.user;
        const profile = await db_1.prisma.profile.findUnique({
            where: { userId },
            include: { photos: { orderBy: { order: 'asc' } } },
        });
        if (!profile) {
            return reply.code(404).send({ error: 'Profile not found' });
        }
        return reply.send({ profile });
    });
    // ────────────────────────────────────────
    // PATCH /api/profiles/me
    // ────────────────────────────────────────
    app.patch('/me', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id: userId } = request.user;
        const body = updateProfileSchema.safeParse(request.body);
        if (!body.success) {
            return reply.code(400).send({ error: 'Validation Error', issues: body.error.issues });
        }
        const data = body.data;
        // Проверяем заполненность профиля
        const profile = await db_1.prisma.profile.update({
            where: { userId },
            data: {
                ...data,
                birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
                updatedAt: new Date(),
            },
            include: { photos: true },
        });
        // Обновляем isComplete
        const isComplete = Boolean(profile.name &&
            profile.birthDate &&
            profile.gender &&
            profile.city &&
            (profile.bioRu || profile.bioUz || profile.bioEn) &&
            profile.photos.length > 0);
        await db_1.prisma.profile.update({
            where: { userId },
            data: { isComplete },
        });
        return reply.send({ profile: { ...profile, isComplete } });
    });
    // ────────────────────────────────────────
    // GET /api/profiles/:id
    // ────────────────────────────────────────
    app.get('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const profile = await db_1.prisma.profile.findUnique({
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
    });
    // ────────────────────────────────────────
    // GET /api/profiles/discover
    // Получить кандидатов для свайпа
    // ────────────────────────────────────────
    app.get('/discover', { preHandler: [app.authenticate] }, async (request, reply) => {
        const { id: userId } = request.user;
        const { limit = '10' } = request.query;
        // Получаем профиль текущего пользователя с настройками поиска
        const myProfile = await db_1.prisma.profile.findUnique({ where: { userId } });
        if (!myProfile) {
            return reply.code(404).send({ error: 'Сначала заполните профиль' });
        }
        // ID пользователей, которых уже лайкнули или заблокировали
        const alreadyLiked = await db_1.prisma.like.findMany({
            where: { fromUserId: userId },
            select: { toUserId: true },
        });
        const excludeIds = [userId, ...alreadyLiked.map(l => l.toUserId)];
        // Вычисляем возраст для фильтрации
        const now = new Date();
        const maxBirthDate = new Date(now.getFullYear() - myProfile.searchAgeMin, now.getMonth(), now.getDate());
        const minBirthDate = new Date(now.getFullYear() - myProfile.searchAgeMax, now.getMonth(), now.getDate());
        const candidates = await db_1.prisma.profile.findMany({
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
    });
}
//# sourceMappingURL=profiles.js.map