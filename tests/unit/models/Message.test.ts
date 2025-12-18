import { describe, it, expect } from 'bun:test';
import mongoose from 'mongoose';
import Message from '../../../src/models/Message';

describe('Message Model Unit Tests', () => {

    it('should validate a valid user question (<= 500 chars)', () => {
        const message = new Message({
            conversationId: new mongoose.Types.ObjectId(),
            role: 'user',
            text: 'a'.repeat(500),
            isQuestion: true
        });
        const error = message.validateSync();
        expect(error).toBeUndefined();
    });

    it('should invalidate a user question > 500 chars', () => {
        const message = new Message({
            conversationId: new mongoose.Types.ObjectId(),
            role: 'user',
            text: 'a'.repeat(501),
            isQuestion: true
        });
        const error = message.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors['text']).toBeDefined();
    });

    it('should validate a valid assistant answer (<= 1000 chars)', () => {
        const message = new Message({
            conversationId: new mongoose.Types.ObjectId(),
            role: 'assistant',
            text: 'a'.repeat(1000),
            isAnswer: true
        });
        const error = message.validateSync();
        expect(error).toBeUndefined();
    });

    it('should invalidate an assistant answer > 1000 chars', () => {
        const message = new Message({
            conversationId: new mongoose.Types.ObjectId(),
            role: 'assistant',
            text: 'a'.repeat(1001),
            isAnswer: true
        });
        const error = message.validateSync();
        expect(error).toBeDefined();
        expect(error?.errors['text']).toBeDefined();
    });

    it('should validate normal text if not question/answer flags set', () => {
        const message = new Message({
            conversationId: new mongoose.Types.ObjectId(),
            role: 'system',
            text: 'a'.repeat(2000), // Should pass as flags are false by default
            isQuestion: false,
            isAnswer: false
        });
        const error = message.validateSync();
        expect(error).toBeUndefined();
    });
});
