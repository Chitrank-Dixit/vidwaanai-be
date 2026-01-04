import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './tokenService';
import RefreshToken from '../models/RefreshToken';

export class AuthService {
    static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    static async registerUser(data: any) {
        const { email, password, fullName, preferredLanguage } = data;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        const passwordHash = await AuthService.hashPassword(password);

        const user = new User({
            username: email,
            email,
            fullName,
            passwordHash,
            preferences: { language: preferredLanguage || 'en' }
        });

        await user.save();
        return user;
    }

    static async loginUser(email: string, password: string): Promise<any> {
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await AuthService.verifyPassword(password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        if (user.status !== 'active') {
            throw new Error('Account is not active');
        }

        const accessToken = generateAccessToken({ sub: user._id, role: user.role, email: user.email });
        const refreshTokenStr = generateRefreshToken({ userId: user._id });

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await RefreshToken.create({
            token: refreshTokenStr,
            userId: user._id,
            clientId: 'web',
            expiresAt,
            scope: user.scopes
        });

        // Update Last Login
        user.lastLogin = new Date();
        await user.save();

        return { user, accessToken, refreshTokenStr, expiresAt };
    }

    static async refreshAccessToken(token: string) {
        if (!token) throw new Error('Refresh token required');

        const decoded = verifyRefreshToken(token);
        if (!decoded) throw new Error('Invalid refresh token');

        const tokenDoc = await RefreshToken.findOne({ token });
        if (!tokenDoc || tokenDoc.revokedAt || new Date() > tokenDoc.expiresAt) {
            throw new Error('Token expired or revoked');
        }

        const user = await User.findById(tokenDoc.userId);
        if (!user) throw new Error('User not found');

        const newAccessToken = generateAccessToken({ sub: user._id, role: user.role, email: user.email });
        return { accessToken: newAccessToken };
    }

    static async logout(token: string) {
        if (token) {
            await RefreshToken.deleteOne({ token });
        }
    }
}
