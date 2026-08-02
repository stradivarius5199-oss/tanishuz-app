"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketIO = setupSocketIO;
const socket_io_1 = require("socket.io");
function setupSocketIO(app) {
    const io = new socket_io_1.Server(app.server, {
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000', 'http://192.168.30.65:3001'],
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });
    io.on('connection', (socket) => {
        // В реальном проекте тут нужно извлекать токен из socket.handshake.auth.token
        // и проверять его через jwtVerify
        const userId = socket.handshake.query.userId;
        if (userId) {
            // Присоединяем сокет к личной комнате пользователя
            socket.join(`user_${userId}`);
            app.log.info(`Socket: User ${userId} connected (${socket.id})`);
        }
        socket.on('disconnect', () => {
            app.log.info(`Socket: User ${userId} disconnected`);
        });
        // Обработка набора текста
        socket.on('typing', (data) => {
            socket.to(`user_${data.receiverId}`).emit('typing', {
                matchId: data.matchId,
                senderId: userId
            });
        });
        // Отправка сообщения напрямую через сокет (опционально, у нас есть POST /messages)
        // socket.on('send_message', async (data) => { ... })
    });
    // Добавляем инстанс io в Fastify, чтобы можно было вызывать app.io.emit(...) из роутов
    app.decorate('io', io);
}
//# sourceMappingURL=socket.js.map