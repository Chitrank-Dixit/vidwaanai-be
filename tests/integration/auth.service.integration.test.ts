import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { setupTestDB, teardownTestDB, clearTestDB } from '../utils/test-db';
import { AuthService } from '../../src/services/authService';
import User from '../../src/models/User';
import RefreshToken from '../../src/models/RefreshToken';

describe('Auth Service Integration', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    afterEach(async () => {
        await clearTestDB();
    });

    describe('registerUser()', () => {
        it('should create user in DB', async () => {
            const data = { email: 'reg@test.com', password: 'Pass!', fullName: 'Reg User' };
            const user = await AuthService.registerUser(data);
            expect(user._id).toBeDefined();
            const dbUser = await User.findById(user._id);
            expect(dbUser).toBeDefined();
            expect(dbUser?.email).toBe('reg@test.com');
            expect(dbUser?.passwordHash).not.toBe('Pass!');
        });

        it('should create different salts', async () => {
            const data1 = { email: 'reg1@test.com', password: 'Pass!', fullName: 'Reg User 1' };
            const data2 = { email: 'reg2@test.com', password: 'Pass!', fullName: 'Reg User 2' };
            const u1 = await AuthService.registerUser(data1);
            const u2 = await AuthService.registerUser(data2);
            expect(u1.passwordHash).not.toBe(u2.passwordHash);
        });
    });

    describe('loginUser()', () => {
        it('should return tokens', async () => {
            await AuthService.registerUser({ email: 'log@test.com', password: 'Pass!', fullName: 'Log User' });
            const result = await AuthService.loginUser('log@test.com', 'Pass!');
            expect(result.accessToken).toBeDefined();
            expect(result.refreshTokenStr).toBeDefined();

            const rt = await RefreshToken.findOne({ token: result.refreshTokenStr });
            expect(rt).toBeDefined();
        });

        it('should reject wrong pass', async () => {
            await AuthService.registerUser({ email: 'log2@test.com', password: 'Pass!', fullName: 'Log User' });
            // bun:test usually uses promise rejection
            try {
                await AuthService.loginUser('log2@test.com', 'Wrong');
                expect(true).toBe(false); // fail
            } catch (e: any) {
                expect(e.message).toBe('Invalid credentials');
            }
        });
    });
});
