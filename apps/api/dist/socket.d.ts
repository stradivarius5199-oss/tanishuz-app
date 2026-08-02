import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
export declare function setupSocketIO(app: FastifyInstance): void;
declare module 'fastify' {
    interface FastifyInstance {
        io: Server;
    }
}
//# sourceMappingURL=socket.d.ts.map