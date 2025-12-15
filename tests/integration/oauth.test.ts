import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import User from '../../src/models/User';
import OAuthClient from '../../src/models/OAuthClient';
import { generateCodeChallenge } from '../../src/utils/crypto';
import app from '../../src/index';

// We need to connect to the DB for tests
// In a real scenario, we'd use a test DB or bun-mongodb-memory-server
// For now we rely on the docker container's DB or mock it if we were doing unit tests.
// Since we are doing integration tests against the live app structure, let's assume we can connect.
// NOTE: Docker networking might make 'localhost' tricky if running from *outside* but if running *inside* check:

const TEST_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vidwaan_test';

describe('OAuth 2.0 Flow', () => {
    let server: any; // Hono app doesn't need start/stop like Express, but we might need to close DB

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(TEST_DB_URI);
        }

        // Cleanup
        await User.deleteMany({});
        await OAuthClient.deleteMany({});

        // Seed
        await User.create({
            username: 'testu',
            email: 'test@example.com',
            password: 'password123',
            role: 'user',
            scopes: ['read:chat']
        });

        await OAuthClient.create({
            clientId: 'test-client',
            clientSecret: 'secret',
            clientName: 'Test Client',
            redirectUris: ['http://localhost/cb'],
            allowedScopes: ['read:chat'],
            grantTypes: ['authorization_code'],
            isPublic: true
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('GET /oauth/authorize should return login page', async () => {
        const req = new Request('http://localhost:3001/oauth/authorize?client_id=test-client&redirect_uri=http://localhost/cb&response_type=code&scope=read:chat&state=init');
        const res = await app.fetch(req);
        expect(res.status).toBe(200);
        const text = await res.text();
        expect(text).toContain('Login');
    });

    it('POST /oauth/login-action should redirect with code', async () => {
        // We simulate the form submission
        const formData = new FormData();
        formData.append('username', 'testu');
        formData.append('password', 'password123');
        formData.append('client_id', 'test-client');
        formData.append('redirect_uri', 'http://localhost/cb');
        formData.append('state', 'xyz');
        formData.append('scope', 'read:chat');
        formData.append('response_type', 'code');
        // PKCE
        const verifier = 'test-verifier-string-min-43-chars-long-enough';
        const challenge = generateCodeChallenge(verifier, 'S256');
        formData.append('code_challenge', challenge);
        formData.append('code_challenge_method', 'S256');

        const req = new Request('http://localhost:3001/oauth/login-action', {
            method: 'POST',
            body: formData,
        });

        const res = await app.fetch(req);
        expect(res.status).toBe(302);
        const location = res.headers.get('Location');
        expect(location).toContain('code=');
        expect(location).toContain('state=xyz');
    });

    it('POST /oauth/token should exchange code for token', async () => {
        // 1. Get a code first
        const verifier = 'test-verifier-string-min-43-chars-long-enough';
        const challenge = generateCodeChallenge(verifier, 'S256');

        // Manually create code via helper or just re-run the login flow?
        // Let's re-run login flow quickly to get a fresh code
        const formData = new FormData();
        formData.append('username', 'testu');
        formData.append('password', 'password123');
        formData.append('client_id', 'test-client');
        formData.append('redirect_uri', 'http://localhost/cb');
        formData.append('state', 'xyz');
        formData.append('scope', 'read:chat');
        formData.append('response_type', 'code');
        formData.append('code_challenge', challenge);
        formData.append('code_challenge_method', 'S256');

        const loginReq = new Request('http://localhost:3001/oauth/login-action', {
            method: 'POST',
            body: formData,
        });
        const loginRes = await app.fetch(loginReq);
        const location = loginRes.headers.get('Location');
        const code = new URL(location!).searchParams.get('code');

        // 2. Exchange
        const tokenReq = new Request('http://localhost:3001/oauth/token', {
            method: 'POST',
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: 'test-client',
                code_verifier: verifier,
                redirect_uri: 'http://localhost/cb' // Technically not validated in our service helper yet but good practice
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        const res = await app.fetch(tokenReq);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.access_token).toBeDefined();
        expect(data.refresh_token).toBeDefined();
        expect(data.scope).toBe('read:chat');
    });
});
