import { Server } from 'socket.io';
// @ts-ignore
import { createBunWebSocket } from '@socket.io/bun-engine'; // Using raw import if types fail, or wait for install
import { socketAuthMiddleware } from './middleware';
import { registerSocketEvents } from './events';

let io: Server;

export const initSocket = (server: any) => {
    // There are multiple ways to init with Bun. 
    // If using Hono's fetch, we need to attach to the Bun.serve instance or handle upgrades.
    // The @socket.io/bun-engine allows us to create a handler.

    io = new Server({
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST']
        },
        // We will attach the adapter/engine logic in the main index.ts
    });

    io.use(socketAuthMiddleware);
    registerSocketEvents(io);

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};
