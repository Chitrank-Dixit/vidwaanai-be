import { describe, expect, it } from 'bun:test';
import mongoose from 'mongoose';
import Conversation from '../../src/models/Conversation';
import Message from '../../src/models/Message';

describe('Model Unit Tests', () => {

    describe('Conversation Model', () => {
        it('should validate required fields', async () => {
            const conversation = new Conversation({});
            try {
                await conversation.validate();
            } catch (err: any) {
                expect(err.errors.userId).toBeDefined();
                expect(err.errors.title).toBeDefined();
            }
        });

        it('should create a valid conversation', () => {
            const conversation = new Conversation({
                userId: new mongoose.Types.ObjectId(),
                title: 'Test Conversation',
                agentSessionId: 'test-session-id'
            });
            const err = conversation.validateSync();
            expect(err).toBeUndefined();
            expect(conversation.agentSessionId).toBe('test-session-id');
        });
    });

    describe('Message Model', () => {
        it('should validate required fields', async () => {
            const message = new Message({});
            try {
                await message.validate();
            } catch (err: any) {
                expect(err.errors.conversationId).toBeDefined();
                expect(err.errors.role).toBeDefined();
                expect(err.errors.text).toBeDefined();
            }
        });

        it('should validate text length for questions', async () => {
            const longText = 'a'.repeat(501);
            const message = new Message({
                conversationId: new mongoose.Types.ObjectId(),
                role: 'user',
                text: longText,
                isQuestion: true
            });

            try {
                await message.validate();
            } catch (err: any) {
                expect(err.errors.text).toBeDefined();
            }
        });

        it('should validate text length for answers', async () => {
            const longText = 'a'.repeat(1001);
            const message = new Message({
                conversationId: new mongoose.Types.ObjectId(),
                role: 'assistant',
                text: longText,
                isAnswer: true
            });

            try {
                await message.validate();
            } catch (err: any) {
                expect(err.errors.text).toBeDefined();
            }
        });

        it('should create a valid message', () => {
            const message = new Message({
                conversationId: new mongoose.Types.ObjectId(),
                role: 'user',
                text: 'Hello',
                isQuestion: true
            });
            const err = message.validateSync();
            expect(err).toBeUndefined();
        });
    });
});
