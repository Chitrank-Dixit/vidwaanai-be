import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { setupTestDB, teardownTestDB, clearTestDB } from '../utils/test-db';
import { testRequest, createTestUser } from '../utils/test-helpers';
import { generateAccessToken } from '../../src/services/tokenService';

describe('Chat Routes Functional Tests', () => {
    let token: string;
    let userId: string;

    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    afterEach(async () => {
        await clearTestDB();
    });

    const getAuthHeaders = async () => {
        const user = await createTestUser();
        userId = user._id.toString();
        const t = generateAccessToken({ sub: userId, role: user.role, email: user.email });
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${t}`
        };
    };

    describe('POST /api/chat/messages', () => {
        it('should create message', async () => {
            const headers = await getAuthHeaders();
            // Conversation creation first? Or api creates it?
            // The API expects conversationId.
            // Let's create conversation first via service or api
            // Or use an ID if we want to fail or succeed?
            // Actually let's create a conversation directly
            const { default: Conversation } = await import('../../src/models/Conversation');
            const conv = await Conversation.create({ userId, title: 'Test' });

            const res = await testRequest('/api/chat/messages', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    conversationId: conv._id,
                    text: 'Hello',
                    role: 'user'
                })
            });
            // Note: Current impl awaits Agent! This might timeout if agent is offline.
            // But we mocked Agent? 
            // In unit tests we mocked fetch.
            // In functional tests, real fetch is used.
            // If Agent URL is localhost:8001, it will fail 500 or timeout.
            // We should mock fetch in setup.ts globally or handle agent failure gracefully.
            // For now, let's see. The backend catches agent error and logs it, but still returns?
            // Actually the code: `if (role === 'user' ...) { ... await queryAgent ... }`
            // If queryAgent throws, it is caught: `catch(err) { console.error... }`.
            // So it should return 201 with user message.

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.text).toBe('Hello');
        });
    });
});
