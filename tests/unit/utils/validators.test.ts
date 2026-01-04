import { describe, it, expect } from 'bun:test';
import { isValidEmail, isValidPassword, sanitizeInput, isValidUrl } from '../../../src/utils/validators';

describe('Validator Utils', () => {
    describe('isValidEmail()', () => {
        it('should validate correct email', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
        });

        it('should invalidate incorrect email', () => {
            expect(isValidEmail('plainaddress')).toBe(false);
            expect(isValidEmail('@missinguser.com')).toBe(false);
            expect(isValidEmail('user@.com')).toBe(false);
            expect(isValidEmail('')).toBe(false);
        });
    });

    describe('isValidPassword()', () => {
        it('should validate strong password', () => {
            expect(isValidPassword('Pass1234')).toBe(true); // Min 8, 1 up, 1 num
        });

        it('should invalidate short password', () => {
            expect(isValidPassword('Pass1')).toBe(false);
        });

        it('should invalidate password without number', () => {
            expect(isValidPassword('Password')).toBe(false);
        });

        it('should invalidate password without uppercase', () => {
            expect(isValidPassword('password123')).toBe(false);
        });
    });

    describe('sanitizeInput()', () => {
        it('should trim whitespace', () => {
            expect(sanitizeInput('  test  ')).toBe('test');
        });

        it('should remove HTML tags (XSS)', () => {
            expect(sanitizeInput('<script>alert(1)</script>test')).toBe('test');
            expect(sanitizeInput('<b>bold</b>')).toBe('bold');
        });

        it('should preserve valid input', () => {
            expect(sanitizeInput('Valid Input 123')).toBe('Valid Input 123');
        });
    });

    describe('isValidUrl()', () => {
        it('should validate http/https urls', () => {
            expect(isValidUrl('https://example.com')).toBe(true);
            expect(isValidUrl('http://localhost:3000')).toBe(true);
        });

        it('should invalidate non-urls', () => {
            expect(isValidUrl('not-a-url')).toBe(false);
            expect(isValidUrl('ftp://example.com')).toBe(false); // only http/s allowed per impl
        });
    });
});
