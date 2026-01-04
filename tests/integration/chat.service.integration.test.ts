import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { setupTestDB, teardownTestDB, clearTestDB } from '../utils/test-db';
import { createConversation, addMessage, getMessages } from '../../src/services/chatService';
import Conversation from '../../src/models/Conversation';
import Message from '../../src/models/Message';

describe('Chat Service Integration', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    afterEach(async () => {
        await clearTestDB();
    });

    describe('Conversation Management', () => {
        it('should create conversation', async () => {
            const c = await createConversation('u1', 'Test Title');
            expect(c._id).toBeDefined();
            const dbC = await Conversation.findById(c._id);
            expect(dbC).toBeDefined();
            expect(dbC?.title).toBe('Test Title');
        });
    });

    describe('Message Management', () => {
        it('should add valid message', async () => {
            const c = await createConversation('u1', 'Test');
            const m = await addMessage(c._id.toString(), 'user', 'Hello');
            expect(m._id).toBeDefined();

            const dbM = await Message.findById(m._id);
            expect(dbM?.text).toBe('Hello');
            expect(dbM?.conversationId.toString()).toBe(c._id.toString());
        });

        it('should retrieve messages', async () => {
            const c = await createConversation('u1', 'Test');
            await addMessage(c._id.toString(), 'user', 'Hi');
            await addMessage(c._id.toString(), 'assistant', 'Hello there');

            const msgs = await getMessages(c._id.toString());
            expect(msgs.length).toBe(2);
            expect(msgs[0].role).toBe('user');
            expect(msgs[1].role).toBe('assistant');
        });
    });
});
