import { createHash, randomBytes } from 'crypto';

export const generateRandomString = (length: number = 32): string => {
    return randomBytes(length).toString('hex');
};

export const generateCodeChallenge = (verifier: string, method: 'S256' | 'plain' = 'S256'): string => {
    if (method === 'plain') {
        return verifier;
    }
    return createHash('sha256').update(verifier).digest('base64url');
};

export const verifyCodeChallenge = (verifier: string, challenge: string, method: 'S256' | 'plain' = 'S256'): boolean => {
    const generatedChallenge = generateCodeChallenge(verifier, method);
    return generatedChallenge === challenge;
};
