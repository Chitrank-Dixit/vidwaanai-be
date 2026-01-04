import { describe, it, expect, jest, mock } from 'bun:test';
import { authMiddleware } from '../../../src/middleware/auth';
import { generateAccessToken } from '../../../src/services/tokenService';

describe('Auth Middleware', () => {
    it('should set user context for valid token', async () => {
        const token = generateAccessToken({ sub: '123', role: 'user' });
        const c: any = {
            req: {
                header: (name: string) => name === 'Authorization' ? `Bearer ${token}` : undefined
            },
            set: (key: string, val: any) => {
                c.user = val;
            },
            json: (data: any, status: number) => ({ data, status })
        };
        const next = async () => { };

        await authMiddleware(c, next);
        expect(c.user).toBeDefined();
        expect(c.user.sub).toBe('123');
    });

    it('should return 401 for missing token', async () => {
        const c: any = {
            req: {
                header: (name: string) => undefined
            },
            json: (data: any, status: number) => ({ data, status }) // Mock return
        };
        const next = async () => { };

        const result = await authMiddleware(c, next);
        // @ts-ignore
        expect(result.status).toBe(401);
    });

    it('should return 401 for invalid token', async () => {
        const c: any = {
            req: {
                header: (name: string) => 'Bearer invalid-token'
            },
            json: (data: any, status: number) => ({ data, status })
        };
        const next = async () => { };

        const result = await authMiddleware(c, next);
        // @ts-ignore
        expect(result.status).toBe(401);
    });
});
