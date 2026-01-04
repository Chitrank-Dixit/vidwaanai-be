import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { setupTestDB, teardownTestDB, clearTestDB } from '../utils/test-db';
import { testRequest, createTestUser } from '../utils/test-helpers';
import { generateAccessToken } from '../../src/services/tokenService';
import Conversation from '../../src/models/Conversation';
import Message from '../../src/models/Message';

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

    describe('POST /api/chat/conversations', () => {
        it('should create a new conversation with initial message', async () => {
            const headers = await getAuthHeaders();
            const res = await testRequest('/api/chat/conversations', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    message: 'Hello AI'
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.answer).toBeDefined();
        });

        it('should requires message/question', async () => {
            const headers = await getAuthHeaders();
            const res = await testRequest('/api/chat/conversations', {
                method: 'POST',
                headers,
                body: JSON.stringify({})
            });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/chat/conversations', () => {
        it('should list conversations for user', async () => {
            const headers = await getAuthHeaders();

            // Seed conversation
            await Conversation.create({
                userId,
                title: 'Test Conv',
                agentSessionId: 'uuid-session' // Use schema field if needed
            });

            const res = await testRequest('/api/chat/conversations', {
                method: 'GET',
                headers
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.conversations).toBeDefined();
            expect(body.conversations.length).toBe(1);
            expect(body.conversations[0].title).toBe('Test Conv');
        });

        it('should support pagination', async () => {
            const headers = await getAuthHeaders();
            await Conversation.create({ userId, title: 'C1' });
            await Conversation.create({ userId, title: 'C2' });

            const res = await testRequest('/api/chat/conversations?limit=1', {
                method: 'GET',
                headers
            });
            const body = await res.json();
            expect(body.conversations.length).toBe(1);
            expect(body.pagination.total).toBe(2);
        });
    });

    describe('POST /api/chat/messages', () => {
        it('should add message to conversation', async () => {
            const headers = await getAuthHeaders();
            const conv = await Conversation.create({ userId, title: 'Msg Test' });

            const res = await testRequest('/api/chat/messages', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    conversationId: conv._id.toString(), // Use _id
                    text: 'User Message',
                    role: 'user'
                })
            });

            expect(res.status).toBe(201);
            const body = await res.json();
            expect(body.text).toBe('User Message');
            expect(body.answer).toBeDefined();
        });
    });

    describe('GET /api/chat/messages', () => {
        it('should retrieve messages for conversation', async () => {
            const headers = await getAuthHeaders();
            const conv = await Conversation.create({ userId, title: 'Get Msgs' });
            const cId = conv._id.toString();

            await Message.create({ conversationId: cId, role: 'user', text: 'Hi', userId });

            const res = await testRequest(`/api/chat/messages?conversationId=${cId}`, {
                method: 'GET',
                headers
            });

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.messages).toBeDefined();
            expect(body.messages.length).toBe(1);
            expect(body.messages[0].text).toBe('Hi');
        });
    });

    describe('DELETE /api/chat/conversations/:id', () => {
        it('should delete conversation', async () => {
            const headers = await getAuthHeaders();
            const conv = await Conversation.create({ userId, title: 'To Delete' });
            const cId = conv._id.toString();

            const res = await testRequest(`/api/chat/conversations/${cId}`, {
                method: 'DELETE',
                headers
            });

            expect(res.status).toBe(200);

            // Verify DB
            const exists = await Conversation.findById(cId);
            expect(exists).toBeNull();
        });

        it('should fail for non-existent conversation', async () => {
            const headers = await getAuthHeaders();
            // Use a valid but non-existent ObjectId
            const res = await testRequest('/api/chat/conversations/507f1f77bcf86cd799439011', {
                method: 'DELETE',
                headers
            });
            expect(res.status).toBe(404);
        });
    });
});
