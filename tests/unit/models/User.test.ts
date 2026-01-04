import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import User from '../../src/models/User';
import mongoose from 'mongoose'; // Mongoose types

describe('User Model Unit Tests', () => {
    // Mongoose models often fail in pure unit tests without connection 
    // unless we use validate()

    it('should validate valid user', async () => {
        const user = new User({
            email: 'test@example.com',
            username: 'testuser',
            fullName: 'Test User',
            passwordHash: 'hashed',
        });
        await expect(user.validate()).resolves.toBeUndefined();
    });

    it('should invalidate empty email', async () => {
        const user = new User({
            username: 'testuser',
            fullName: 'Test User',
            passwordHash: 'hashed',
        });
        await expect(user.validate()).rejects.toThrow();
    });
});
