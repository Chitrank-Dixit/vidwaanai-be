import { describe, it, expect } from 'bun:test';
import { AuthService } from '../../../src/services/authService';

describe('AuthService Unit Tests', () => {
    describe('hashPassword()', () => {
        it('should hash password with bcrypt', async () => {
            const password = 'TestPassword123!';
            const hash = await AuthService.hashPassword(password);
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'TestPassword123!';
            const hash1 = await AuthService.hashPassword(password);
            const hash2 = await AuthService.hashPassword(password);
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('verifyPassword()', () => {
        it('should return true for correct password', async () => {
            const password = 'TestPassword123!';
            const hash = await AuthService.hashPassword(password);
            const isValid = await AuthService.verifyPassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('should return false for incorrect password', async () => {
            const password = 'TestPassword123!';
            const hash = await AuthService.hashPassword(password);
            const isValid = await AuthService.verifyPassword('WrongPassword', hash);
            expect(isValid).toBe(false);
        });
    });
});
