import { describe, it, expect } from 'bun:test';
import { generateRandomString, generateCodeChallenge, verifyCodeChallenge } from '../../../src/utils/crypto';

describe('Crypto Utils Unit Tests', () => {
    describe('generateRandomString()', () => {
        it('should generate string of specified length', () => {
            const str = generateRandomString(16);
            expect(str).toBeDefined();
            expect(str.length).toBeGreaterThan(0);
        });
    });

    describe('OAuth Code Challenge', () => {
        it('should generate and verify S256 challenge', () => {
            const verifier = 'test-verifier';
            const challenge = generateCodeChallenge(verifier, 'S256');
            const isValid = verifyCodeChallenge(verifier, challenge, 'S256');
            expect(isValid).toBe(true);
        });

        it('should verify plain method', () => {
            const verifier = 'test-verifier';
            const challenge = generateCodeChallenge(verifier, 'plain');
            expect(challenge).toBe(verifier);
            const isValid = verifyCodeChallenge(verifier, challenge, 'plain');
            expect(isValid).toBe(true);
        });
    });
});
