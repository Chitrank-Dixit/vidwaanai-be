import { describe, it, expect } from 'bun:test';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../src/services/tokenService';

describe('TokenService Unit Tests', () => {
    describe('generateAccessToken()', () => {
        it('should generate valid JWT token', () => {
            const payload = { sub: '123', role: 'user' };
            const token = generateAccessToken(payload);
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3);
        });
    });

    describe('verifyAccessToken()', () => {
        it('should verify valid token', () => {
            const payload = { sub: '123', role: 'user' };
            const token = generateAccessToken(payload);
            const decoded = verifyAccessToken(token);
            expect(decoded.sub).toBe('123');
            expect(decoded.role).toBe('user');
        });
    });

    describe('generateRefreshToken()', () => {
        it('should generate valid refresh token', () => {
            const payload = { userId: '123' };
            const token = generateRefreshToken(payload);
            expect(typeof token).toBe('string');
        });
    });
});
