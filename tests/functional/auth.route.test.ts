import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { setupTestDB, teardownTestDB, clearTestDB } from '../utils/test-db';
import { testRequest, createTestUser } from '../utils/test-helpers';
import User from '../../src/models/User';
import { generateAccessToken } from '../../src/services/tokenService';

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
        const validUser = {
            email: 'new@example.com',
            password: 'PassWord123!',
            fullName: 'New User'
        };

        it('should register new user successfully', async () => {
            const res = await testRequest('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validUser)
            });
            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.success).toBe(true);
            expect(body.data.email).toBe(validUser.email);
            expect(body.data.password).toBeUndefined(); // Security check
        });

        it('should fail with duplicate email', async () => {
            await createTestUser({ email: validUser.email });
            const res = await testRequest('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validUser)
            });
            expect(res.status).toBe(409);
        });

        it('should fail with missing required fields', async () => {
            const res = await testRequest('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'incomplete@example.com' })
            });
            expect(res.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
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
            expect(body.data.accessToken).toBeDefined();

            // Check cookie
            const cookies = res.headers.get('set-cookie');
            expect(cookies).toContain('refreshToken');
        });

        it('should fail with invalid password', async () => {
            await createTestUser({ email: 'login@example.com', password: 'Password123!' });
            const res = await testRequest('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'login@example.com',
                    password: 'WrongPassword'
                })
            });
            expect(res.status).toBe(401);
        });

        it('should fail for non-existent user', async () => {
            const res = await testRequest('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'ghost@example.com',
                    password: 'Password123!'
                })
            });
            expect(res.status).toBe(401); // Or 500 depending on implementation if not handled, but expected 401
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should refresh token using valid cookie', async () => {
            // 1. Login to get cookie
            await createTestUser({ email: 'refresh@example.com', password: 'Password123!' });
            const loginRes = await testRequest('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'refresh@example.com', password: 'Password123!' })
            });
            const cookies = loginRes.headers.get('set-cookie');

            // 2. Refresh
            const res = await testRequest('/api/auth/refresh', {
                method: 'POST',
                headers: { 'Cookie': cookies || '' }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.accessToken).toBeDefined();
        });

        it('should fail without refresh token cookie', async () => {
            const res = await testRequest('/api/auth/refresh', {
                method: 'POST'
            });
            expect(res.status).toBe(401); // Controller says 403 or 401
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            // 1. Login
            await createTestUser({ email: 'logout@example.com', password: 'Password123!' });
            const loginRes = await testRequest('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'logout@example.com', password: 'Password123!' })
            });
            const cookies = loginRes.headers.get('set-cookie');

            // 2. Logout
            const res = await testRequest('/api/auth/logout', {
                method: 'POST',
                headers: { 'Cookie': cookies || '' }
            });

            expect(res.status).toBe(200);
            // Verify cookie is cleared (usually by setting expiry to past)
            const logoutCookies = res.headers.get('set-cookie');
            expect(logoutCookies).toContain('Max-Age=0'); // Standard way to clear cookie
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return profile for authenticated user', async () => {
            const user = await createTestUser({ email: 'profile@example.com' });
            const token = generateAccessToken({ sub: user._id.toString(), role: user.role, email: user.email });

            const res = await testRequest('/api/auth/profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.data.email).toBe('profile@example.com');
            expect(body.data.id).toBe(user._id.toString());
        });

        it('should fail without token', async () => {
            const res = await testRequest('/api/auth/profile', { method: 'GET' });
            expect(res.status).toBe(401);
        });

        it('should fail with invalid token', async () => {
            const res = await testRequest('/api/auth/profile', {
                method: 'GET',
                headers: { 'Authorization': 'Bearer invalid.token' }
            });
            expect(res.status).toBe(401);
        });
    });
});
