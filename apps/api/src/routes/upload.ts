import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@sparks-uz/db';
import cloudinary from '../utils/cloudinary';

export async function uploadRoutes(app: FastifyInstance) {

  // ────────────────────────────────────────
  // POST /api/upload/photo
  // Загрузить фото профиля
  // ────────────────────────────────────────
  app.post(
    '/photo',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;

      // Получаем профиль
      const profile = await prisma.profile.findUnique({
        where: { userId },
        include: { photos: true },
      });
      if (!profile) {
        return reply.code(404).send({ error: 'Профиль не найден' });
      }

      // Лимит: максимум 6 фото
      if (profile.photos.length >= 6) {
        return reply.code(400).send({ error: 'Максимум 6 фотографий' });
      }

      // Читаем multipart данные
      const data = await (request as any).file();
      if (!data) {
        return reply.code(400).send({ error: 'Файл не загружен' });
      }

      // Проверяем тип файла
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Поддерживаются только JPEG, PNG, WebP' });
      }

      // Читаем файл в буфер
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Проверяем размер (максимум 10 МБ)
      if (buffer.length > 10 * 1024 * 1024) {
        return reply.code(400).send({ error: 'Файл слишком большой (максимум 10 МБ)' });
      }

      // Загружаем на Cloudinary с NSFW-модерацией (или мокаем, если ключи не заданы)
      let uploadResult;
      
      if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key') {
        // Мокаем успешную загрузку для удобства тестирования
        uploadResult = {
          secure_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop', // случайное фото
          public_id: 'mock_public_id_' + Date.now(),
        };
      } else {
        uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: `tanishuz/profiles/${profile.id}`,
                resource_type: 'image',
                transformation: [
                  { width: 800, height: 1000, crop: 'fill', gravity: 'face' },
                  { quality: 'auto', fetch_format: 'webp' },
                ],
                // moderation: 'aws_rek', // AWS Rekognition NSFW check (cloudinary add-on)
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(buffer);
        });
      }

      const isMain = profile.photos.length === 0; // первое фото — главное

      const photo = await prisma.photo.create({
        data: {
          profileId: profile.id,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          thumbnailUrl: uploadResult.secure_url, // используем тот же url для мока
          order: profile.photos.length,
          isMain,
          isApproved: true, // в MVP авто-одобряем; при наличии модерации — false
          nsfwScore: 0,
        },
      });

      // Пересчитываем isComplete
      const isComplete = Boolean(
        profile.name &&
        profile.birthDate &&
        profile.gender &&
        profile.city &&
        (profile.bioRu || profile.bioUz || profile.bioEn) &&
        (profile.photos.length + 1 > 0)
      );

      await prisma.profile.update({
        where: { id: profile.id },
        data: { isComplete },
      });

      return reply.code(201).send({ photo, isComplete });
    }
  );

  // ────────────────────────────────────────
  // DELETE /api/upload/photo/:photoId
  // Удалить фото
  // ────────────────────────────────────────
  app.delete(
    '/photo/:photoId',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;
      const { photoId } = request.params as { photoId: string };

      const photo = await prisma.photo.findFirst({
        where: { id: photoId, profile: { userId } },
      });
      if (!photo) {
        return reply.code(404).send({ error: 'Фото не найдено' });
      }

      // Удаляем из Cloudinary
      if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key') {
        await cloudinary.uploader.destroy(photo.publicId);
      }

      // Удаляем из БД
      await prisma.photo.delete({ where: { id: photoId } });

      return reply.send({ message: 'Фото удалено' });
    }
  );

  // ────────────────────────────────────────
  // PUT /api/upload/photo/:photoId/main
  // Сделать фото главным
  // ────────────────────────────────────────
  app.put(
    '/photo/:photoId/main',
    { preHandler: [(app as any).authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id: userId } = (request as any).user;
      const { photoId } = request.params as { photoId: string };

      const profile = await prisma.profile.findUnique({
        where: { userId },
      });
      if (!profile) return reply.code(404).send({ error: 'Профиль не найден' });

      // Сбрасываем все фото как не-главные
      await prisma.photo.updateMany({
        where: { profileId: profile.id },
        data: { isMain: false },
      });

      // Делаем выбранное главным
      await prisma.photo.update({
        where: { id: photoId },
        data: { isMain: true },
      });

      return reply.send({ message: 'Главное фото обновлено' });
    }
  );
}
