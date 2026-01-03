import { describe, expect, it, beforeAll, afterAll, mock, beforeEach, afterEach } from 'bun:test';
import mongoose from 'mongoose';
import server from '../../src/index';
import Conversation from '../../src/models/Conversation';
import Message from '../../src/models/Message';
import User from '../../src/models/User';
import { generateAccessToken } from '../../src/services/tokenService';

const TEST_EMAIL = `chat_test_${Date.now()}@example.com`;
const TEST_USER_ID = new mongoose.Types.ObjectId();
let accessToken = '';

// Correctly mock Agent API responses
const MOCK_SESSION_ID = 'test-session-uuid';
const MOCK_AGENT_ANSWER = 'This is a mock agent answer';

// Mock the Agent Service module to avoid context loss in async background tasks
mock.module('../../src/services/agentService', () => {
    return {
        createAgentSession: mock(() => Promise.resolve(MOCK_SESSION_ID)),
        queryAgent: mock(() => {
            console.error('[MOCK] queryAgent called');
            return Promise.resolve({
                answer: MOCK_AGENT_ANSWER,
                session_id: MOCK_SESSION_ID,
                confidence: 0.9,
                sources: []
            });
        })
    };
});

describe('Chat API Integration Tests', () => {
    let originalFetch: typeof global.fetch;

    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vidwaan_test');
        }
        await User.deleteMany({ email: TEST_EMAIL });
        await Conversation.deleteMany({ userId: TEST_USER_ID });
        await Message.deleteMany({});

        // Create a test user directly in DB
        const user = await User.create({
            _id: TEST_USER_ID,
            email: TEST_EMAIL,
            username: 'chattester',
            passwordHash: 'hashed_password',
            fullName: 'Chat Tester',
            preferredLanguage: 'en'
        });

        // Generate token
        accessToken = generateAccessToken({ sub: user._id.toString(), role: 'user', email: user.email });
    });

    afterAll(async () => {
        await User.deleteMany({ email: TEST_EMAIL });
        await Conversation.deleteMany({ userId: TEST_USER_ID });
        await Message.deleteMany({});
        await mongoose.disconnect();
    });

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('POST /api/chat/conversations - Should flow correctly (Create Session -> Query Agent -> Save DB)', async () => {
        // global.fetch mock removed as we use module mock

        const res = await server.fetch(new Request('http://localhost/api/chat/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ question: 'Hello Agent' })
        }));

        const body = await res.json();

        // 1. Check API Response
        expect(res.status).toBe(201);
        expect(body.answer).toBe(MOCK_AGENT_ANSWER);
        expect(body.session_id).toBe(MOCK_SESSION_ID);

        // 2. Wait a bit for async DB operations
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Check Database
        const conversation = await Conversation.findOne({ userId: TEST_USER_ID }).sort({ createdAt: -1 });
        expect(conversation).toBeDefined();
        expect(conversation?.agentSessionId).toBe(MOCK_SESSION_ID);
        expect(conversation?.title).toBe('Hello Agent'); // Default title

        const messages = await Message.find({ conversationId: conversation?._id }).sort({ createdAt: 1 });
        expect(messages.length).toBe(2);
        expect(messages[0].role).toBe('user');
        expect(messages[0].text).toBe('Hello Agent');
        expect(messages[1].role).toBe('assistant');
        expect(messages[1].text).toBe(MOCK_AGENT_ANSWER);
    });

    it('POST /api/chat/messages - Should trigger Agent Query for user messages', async () => {
        // 1. Create a conversation first (Seed DB directly since we control MOCK_SESSION_ID)
        const conversation = await Conversation.create({
            userId: TEST_USER_ID,
            title: 'Message Test',
            agentSessionId: MOCK_SESSION_ID
        });
        const conversationId = conversation._id.toString();

        // 2. Mock Agent Query specifically for follow up (optional, generic mock works too)
        // existing mock handles /query -> MOCK_AGENT_ANSWER

        // 3. Post a follow-up message
        const followUpText = 'Follow up question';
        const res = await server.fetch(new Request('http://localhost/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify({
                conversationId,
                role: 'user',
                text: followUpText,
                isQuestion: true
            })
        }));

        expect(res.status).toBe(201);

        // 4. Wait for Async Agent Query
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 5. Verify Messages in DB
        const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
        // Should have: User Message, Agent Message
        expect(messages.length).toBe(2);
        expect(messages[0].text).toBe(followUpText);
        expect(messages[0].role).toBe('user');
        expect(messages[1].text).toBe(MOCK_AGENT_ANSWER);
        expect(messages[1].role).toBe('assistant');
    });
});
