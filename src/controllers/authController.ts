import { Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../services/tokenService';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export class AuthController {
    static async register(c: Context) {
        try {
            const body = await c.req.json();
            const { email, password, fullName, preferredLanguage } = body;

            if (!email || !password || !fullName) {
                return c.json({ success: false, error: 'Missing required fields' }, 400);
            }

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return c.json({ success: false, error: 'Email already registered' }, 409);
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            const user = new User({
                username: email, // Default username to email
                email,
                fullName,
                passwordHash,
                preferences: { language: preferredLanguage || 'en' }
            });

            await user.save();

            return c.json({
                success: true,
                message: 'User registered successfully',
                data: {
                    id: user._id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt
                }
            }, 201);
        } catch (error: any) {
            console.error('Registration Error:', error);
            return c.json({ success: false, error: error.message }, 500);
        }
    }

    static async login(c: Context) {
        try {
            const { email, password } = await c.req.json();

            const user = await User.findOne({ email });
            if (!user) {
                return c.json({ success: false, error: 'Invalid credentials' }, 401);
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return c.json({ success: false, error: 'Invalid credentials' }, 401);
            }

            if (user.status !== 'active') {
                return c.json({ success: false, error: 'Account is not active' }, 403);
            }

            // Generate Tokens
            const accessToken = generateAccessToken({ sub: user._id, role: user.role, email: user.email });
            const refreshTokenStr = generateRefreshToken({ userId: user._id }); // Opaque to client, but JWT internally

            // Store Refresh Token
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

            await RefreshToken.create({
                token: refreshTokenStr,
                userId: user._id,
                clientId: 'web', // Default client
                expiresAt,
                scope: user.scopes
            });

            // Update Last Login
            user.lastLogin = new Date();
            await user.save();

            // Set HttpOnly Cookie
            setCookie(c, 'refreshToken', refreshTokenStr, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict',
                expires: expiresAt,
                path: '/'
            });

            return c.json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    expiresIn: 900,
                    user: {
                        id: user._id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        permissions: user.scopes // Assuming scopes map to permissions
                    }
                }
            });

        } catch (error: any) {
            console.error('Login Error:', error);
            return c.json({ success: false, error: error.message }, 500);
        }
    }

    static async refresh(c: Context) {
        try {
            const refreshTokenStr = getCookie(c, 'refreshToken');
            if (!refreshTokenStr) {
                return c.json({ success: false, error: 'Refresh token not found' }, 401);
            }

            const decoded = verifyRefreshToken(refreshTokenStr);
            if (!decoded) {
                return c.json({ success: false, error: 'Invalid refresh token signature' }, 403);
            }

            const tokenDoc = await RefreshToken.findOne({ token: refreshTokenStr });
            if (!tokenDoc || tokenDoc.revokedAt || new Date() > tokenDoc.expiresAt) {
                return c.json({ success: false, error: 'Token expired or revoked' }, 403);
            }

            // check user
            const user = await User.findById(tokenDoc.userId);
            if (!user) {
                return c.json({ success: false, error: 'User not found' }, 404);
            }

            // Rotate Refresh Token? Plan doesn't explicitly mandate rotation but it's good practice. 
            // For now, simpler implementation: just issue new access token. 
            // The plan says "Scope: Single refresh endpoint", "Used for: Getting new access tokens".

            const newAccessToken = generateAccessToken({ sub: user._id, role: user.role, email: user.email });

            return c.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    expiresIn: 900
                }
            });

        } catch (error: any) {
            return c.json({ success: false, error: 'Invalid or expired refresh token' }, 403);
        }
    }

    static async logout(c: Context) {
        try {
            const refreshTokenStr = getCookie(c, 'refreshToken');
            if (refreshTokenStr) {
                await RefreshToken.deleteOne({ token: refreshTokenStr });
            }

            deleteCookie(c, 'refreshToken');

            return c.json({ success: true, message: 'Logout successful' });
        } catch (error: any) {
            return c.json({ success: false, error: error.message }, 500);
        }
    }
}
