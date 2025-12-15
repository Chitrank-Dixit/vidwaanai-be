import { Socket } from 'socket.io';
import { verifyAccessToken } from '../services/tokenService';

export interface AuthSocket extends Socket {
    user?: any;
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }

    try {
        const payload = verifyAccessToken(token);
        (socket as AuthSocket).user = payload;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
};
