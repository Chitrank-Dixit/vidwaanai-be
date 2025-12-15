import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import connectDB from './config/database';
import oauthRoutes from './routes/oauth';
import chatRoutes from './routes/chat';
import { authMiddleware } from './middleware/auth';
import dotenv from 'dotenv';
import User from './models/User';

import { rateLimiter } from "hono-rate-limiter";
import { secureHeaders } from 'hono/secure-headers';
import { initSocket } from './socket';

dotenv.config();

const app = new Hono();

// Security Middleware
app.use('*', secureHeaders());
app.use('*', rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    keyGenerator: (c) => c.req.header('x-forwarded-for') || 'ip', // simple IP key
}));

// Connect to Database
connectDB();

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: '*', // Configure appropriately for production
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date() }));

// Mount OAuth Routes
app.route('/oauth', oauthRoutes);

// Helper route for form submission that needs to match the action in login.html
// The login.html action is /auth/login. We should probably align these.
// Let's create a separate route handler or just redirect.
app.post('/auth/login', async (c) => {
    // Re-using the logic from oauth routes for now, simpler to forward
    // Or we can import the handler.
    // For clarity, let's just implement a simple forwarder or copy logic.
    // Ideally, the login form action should point to where we mounted the handler.
    // Let's assume we update login.html action to /oauth/login-action or we handle /auth/login here.

    // Quick fix: Request the handler from oauthRoutes
    return oauthRoutes.request('/login-action', c.req.raw);
});


// Protected Routes
const api = new Hono();
api.use('*', authMiddleware);

api.route('/chat', chatRoutes);

app.route('/api', api);

// Start
const port = parseInt(process.env.PORT || '3001');
console.log(`Server is running on port ${port}`);

// Initialize Socket.IO
const io = initSocket(null); // We attach to the server below if using bun direct serving



// Redefining export for Bun
// Bun.serve({ fetch: ... }) is implicitly called when default export has fetch.

// Let's perform a runtime check adjustment:
const ioHandler = (req: Request, server: any) => {
    // This is a placeholder logic. With @socket.io/bun-engine we might need to use 
    // `io.attach(server)` only once on start.
    // Actually, @socket.io/bun-engine usually works by:
    // Bun.serve({ fetch: (req, server) => { ... }, websocket: io.websocket })
    return undefined;
}

export default {
    port,
    fetch: app.fetch,
    websocket: io.websocket, // Crucial for @socket.io/bun-engine
};
