import { Context, Next } from 'hono';
import { verifyAccessToken } from '../services/tokenService';

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'invalid_token', error_description: 'Missing or invalid Authorization header' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = verifyAccessToken(token);
        c.set('user', payload);
        await next();
    } catch (error) {
        return c.json({ error: 'invalid_token', error_description: 'Token expired or invalid' }, 401);
    }
};
