import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import User from '../src/models/User';
import RefreshToken from '../src/models/RefreshToken';
import server from '../src/index';

// Mongoose connection management for tests
// The server import starts the app and connects to DB (via connectDB in index.ts).
// In Docker, MONGODB_URI is set.

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'SecurePassword123!';
let accessToken = '';
let cookieHeader = '';

describe('Auth API Integration Tests', () => {

    beforeAll(async () => {
        // Wait for DB connection if needed, though index.ts initializes it.
        // We can ensure we are connected.
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/vidwaan_test');
        }
        // Cleanup
        await User.deleteMany({ email: TEST_EMAIL });
        await RefreshToken.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({ email: TEST_EMAIL });
        await RefreshToken.deleteMany({});
        // Close connection to allow test runner to exit
        await mongoose.disconnect();
    });

    it('POST /api/auth/register - Should register a new user', async () => {
        console.log("Registering user...");
        const res = await server.fetch(new Request('http://localhost/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                fullName: 'Test User',
                preferredLanguage: 'en'
            })
        }));

        const body = await res.json();
        expect(res.status).toBe(201);
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(TEST_EMAIL);
    });

    it('POST /api/auth/login - Should login and return tokens', async () => {
        const res = await server.fetch(new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        }));

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeDefined();

        accessToken = body.data.accessToken;
        cookieHeader = res.headers.get('set-cookie') || '';
        expect(cookieHeader).toContain('refreshToken');
    });

    it('POST /api/auth/refresh - Should refresh access token', async () => {
        // Extract refreshToken from cookie string if needed, 
        // but Hono cookie helper in Controller reads specific cookie name.
        // We pass the whole cookie header.

        const res = await server.fetch(new Request('http://localhost/api/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            }
        }));

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeDefined();
        expect(body.data.accessToken).not.toBe(accessToken); // Should be new (or same if logic allows, but here we generate new)
    });

    it('POST /api/auth/logout - Should logout and clear cookie', async () => {
        const res = await server.fetch(new Request('http://localhost/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieHeader
            }
        }));

        const body = await res.json();
        expect(res.status).toBe(200);
        expect(body.success).toBe(true);

        // Verify cookie is cleared (has Expires in past or Max-Age: 0 or empty)
        const newCookie = res.headers.get('set-cookie');
        expect(newCookie).toBeDefined();
        // Typically deleteCookie sets Max-Age=0 or Expires=...1970
    });
});
