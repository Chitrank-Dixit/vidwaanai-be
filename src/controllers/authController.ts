import { Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { AuthService } from '../services/authService';

export class AuthController {
    static async register(c: Context) {
        try {
            const body = await c.req.json();
            const { email, password, fullName } = body;

            if (!email || !password || !fullName) {
                return c.json({ success: false, error: 'Missing required fields' }, 400);
            }

            try {
                const user = await AuthService.registerUser(body);
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
            } catch (err: any) {
                if (err.message === 'Email already registered') {
                    return c.json({ success: false, error: err.message }, 409);
                }
                throw err;
            }
        } catch (error: any) {
            console.error('Registration Error:', error);
            return c.json({ success: false, error: error.message }, 500);
        }
    }

    static async login(c: Context) {
        try {
            const { email, password } = await c.req.json();

            try {
                const result = await AuthService.loginUser(email, password);
                const { user, accessToken, refreshTokenStr, expiresAt } = result;

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
            } catch (err: any) {
                if (err.message === 'Invalid credentials') {
                    return c.json({ success: false, error: 'Invalid credentials' }, 401);
                }
                if (err.message === 'Account is not active') {
                    return c.json({ success: false, error: 'Account is not active' }, 403);
                }
                throw err;
            }

        } catch (error: any) {
            console.error('Login Error:', error);
            return c.json({ success: false, error: error.message }, 500);
        }
    }

    static async refresh(c: Context) {
        try {
            const refreshTokenStr = getCookie(c, 'refreshToken');

            try {
                const result = await AuthService.refreshAccessToken(refreshTokenStr || '');
                return c.json({
                    success: true,
                    data: {
                        accessToken: result.accessToken,
                        expiresIn: 900
                    }
                });
            } catch (err: any) {
                const status = (err.message === 'Refresh token required' || err.message === 'Invalid refresh token') ? 401 : 403;
                return c.json({ success: false, error: err.message }, status);
            }

        } catch (error: any) {
            return c.json({ success: false, error: 'Invalid or expired refresh token' }, 403);
        }
    }

    static async logout(c: Context) {
        try {
            const refreshTokenStr = getCookie(c, 'refreshToken');
            await AuthService.logout(refreshTokenStr || '');

            deleteCookie(c, 'refreshToken');

            return c.json({ success: true, message: 'Logout successful' });
        } catch (error: any) {
            return c.json({ success: false, error: error.message }, 500);
        }
    }
}
