import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { setupTestDB, teardownTestDB, clearTestDB } from '../utils/test-db';
import { testRequest, createTestUser } from '../utils/test-helpers';
import User from '../../src/models/User';

describe('Auth Routes Functional Tests', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    afterEach(async () => {
        await clearTestDB();
    });

    describe('POST /api/auth/register', () => {
        it('should register new user', async () => {
            const res = await testRequest('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'new@example.com',
                    password: 'Pass123!',
                    fullName: 'New User'
                })
            });
            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.success).toBe(true);
            expect(body.data.email).toBe('new@example.com');

            const user = await User.findOne({ email: 'new@example.com' });
            expect(user).toBeDefined();
        });

        it('should fail dup email', async () => {
            await createTestUser({ email: 'dup@example.com' });
            const res = await testRequest('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'dup@example.com',
                    password: 'Pass123!',
                    fullName: 'New User'
                })
            });
            expect(res.status).toBe(409);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login valid user', async () => {
            await createTestUser({ email: 'login@example.com', password: 'Password123!' });
            const res = await testRequest('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'login@example.com',
                    password: 'Password123!'
                })
            });
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.success).toBe(true);
            expect(body.data.accessToken).toBeDefined();
        });
    });
});
