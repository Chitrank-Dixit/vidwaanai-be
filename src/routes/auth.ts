import { Hono } from 'hono';
import { AuthController } from '../controllers/authController';

const auth = new Hono();

// Auth Endpoints
auth.post('/register', AuthController.register);
auth.post('/login', AuthController.login);
auth.post('/refresh', AuthController.refresh);
auth.post('/logout', AuthController.logout);

// Helper for verifying email logic if needed later
// auth.post('/verify-email', AuthController.verifyEmail);

export default auth;
