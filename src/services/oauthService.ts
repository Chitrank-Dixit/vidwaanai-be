import OAuthClient from '../models/OAuthClient';
import AuthorizationCode from '../models/AuthorizationCode';
import RefreshToken from '../models/RefreshToken';
import User from '../models/User';
import { generateRandomString, verifyCodeChallenge } from '../utils/crypto';
import { generateAccessToken, generateRefreshToken } from './tokenService';

export const validateClient = async (clientId: string, redirectUri: string) => {
    const client = await OAuthClient.findOne({ clientId });
    if (!client) return null;
    if (!client.redirectUris.includes(redirectUri)) return null;
    return client;
};

export const createAuthorizationCode = async (
    userId: string,
    clientId: string,
    redirectUri: string,
    scope: string[],
    codeChallenge?: string,
    codeChallengeMethod?: string,
    state?: string
) => {
    const code = generateRandomString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const authCode = await AuthorizationCode.create({
        code,
        userId,
        clientId,
        redirectUri,
        scope,
        codeChallenge,
        codeChallengeMethod,
        state,
        expiresAt,
    });

    return authCode;
};

export const exchangeCodeForToken = async (
    code: string,
    clientId: string,
    codeVerifier: string,
    clientSecret?: string
) => {
    // 1. Find the authorization code
    const authCode = await AuthorizationCode.findOne({ code, clientId, used: false });
    if (!authCode) {
        throw new Error('Invalid or expired authorization code');
    }

    // 2. Verify PKCE
    if (authCode.codeChallenge) {
        if (!codeVerifier) {
            throw new Error('Code verifier required');
        }
        const isValid = verifyCodeChallenge(
            codeVerifier,
            authCode.codeChallenge,
            (authCode.codeChallengeMethod as 'S256' | 'plain') || 'S256'
        );
        if (!isValid) {
            throw new Error('Invalid code verifier');
        }
    }

    // 3. Mark code as used
    authCode.used = true;
    await authCode.save();

    // 4. Generate Tokens
    const user = await User.findById(authCode.userId);
    if (!user) throw new Error('User not found');

    const tokenPayload = {
        sub: user._id,
        username: user.username,
        scope: authCode.scope,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenString = generateRandomString(40); // Opaque refresh token
    const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshToken.create({
        token: refreshTokenString,
        userId: user._id,
        clientId: clientId,
        scope: authCode.scope,
        expiresAt: refreshTokenExpiresAt,
    });

    return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 900,
        refresh_token: refreshTokenString,
        scope: authCode.scope.join(' '),
    };
};
