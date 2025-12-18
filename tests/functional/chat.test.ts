import { describe, it, expect, beforeAll } from 'bun:test';
import { Hono } from 'hono';

// Functional tests often need a running server or a way to mock the app request
// Since we are using Hono, we can import the app and use `app.request`
// However, our app is in `src/index.ts` and connects to DB on start.
// Ideally, we'd export the app separately from the server start logic.
// For now, let's assume we can fetch against the running Docker container or mock.

// Actually, `bun test` inside the container can import `src/index.ts`.
// But `src/index.ts` starts the server on import side-effect.
// A better pattern is to test against the running service URL if essentially E2E/Functional.

const BASE_URL = process.env.BASE_URL || 'http://backend:3001';

describe('Chat API Functional Tests', () => {
    let authToken: string;
    let createdConversationId: string;

    // Helper to get auth token (requires running OAuth flow or seed)
    // For this test, we might need to rely on a seeded token or just mock the auth middleware if possible?
    // Since we are running against a real backend, we need real auth.
    // Let's assume we can login with the test credentials we set up.

    // BUT: The implementation plan said "Verify Auth middleware protection".
    // Let's first test protected routes without token.

    it('should reject unauthenticated access to /api/chat/conversations', async () => {
        const res = await fetch(`${BASE_URL}/api/chat/conversations`);
        expect(res.status).toBe(401);
    });

    // To test success, we need a valid token. 
    // This is hard without a full flow. 
    // Alternative: We can use a "test-only" endpoint or a mocked token if we control the JWT secret.
    // We do validation using `jsonwebtoken` and `process.env.JWT_SECRET`.
    // In the test env, we can generate a valid token if we share the secret.

    it('should allow access with valid token', async () => {
        // We need to generate a token. 
        // We can use `jsonwebtoken` here in the test file if we install it or import from src.
        // Let's try to import the token service or creating one manually.
        const jwt = await import('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'your_jwt_secret';

        const token = jwt.default.sign(
            { sub: '5f8d0d55b54764421b7156c9', username: 'testuser', role: 'user', scopes: ['chat:read', 'chat:write'] },
            secret,
            { expiresIn: '1h' }
        );
        authToken = token;

        const res = await fetch(`${BASE_URL}/api/chat/conversations`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        // It might return 200 with empty list or similar
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('conversations');
    });

    it('should create a conversation and return it', async () => {
        const res = await fetch(`${BASE_URL}/api/chat/conversations`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'Test Conversation',
                description: 'Functional test'
            })
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data).toHaveProperty('_id');
        expect(data.title).toBe('Test Conversation');
        createdConversationId = data._id;
    });

    it('should post a valid question message', async () => {
        const res = await fetch(`${BASE_URL}/api/chat/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: createdConversationId,
                role: 'user',
                text: 'Hello, this is a question.',
                isQuestion: true
            })
        });

        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.text).toBe('Hello, this is a question.');
    });

    it('should reject a question message > 500 chars', async () => {
        const res = await fetch(`${BASE_URL}/api/chat/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: createdConversationId,
                role: 'user',
                text: 'a'.repeat(501),
                isQuestion: true
            })
        });

        // Mongoose validation error should return 400 or 500 depending on handler
        // Standard Hono `c.json` might not verify validation automatically without middleware?
        // Wait, Mongoose throws error on save. If error handler is generic, it might be 500.
        // Let's expect failure.
        expect(res.status).not.toBe(201);
    });
});
