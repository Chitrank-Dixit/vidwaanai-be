import { Hono } from 'hono';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono();

// Auth Endpoints
auth.post('/register', AuthController.register);
auth.post('/login', AuthController.login);
auth.post('/refresh', AuthController.refresh);
auth.post('/logout', AuthController.logout);
auth.get('/profile', authMiddleware, AuthController.getProfile);

// Helper for verifying email logic if needed later
// auth.post('/verify-email', AuthController.verifyEmail);

export default auth;
