import { Hono } from 'hono';
import { validateClient, createAuthorizationCode, exchangeCodeForToken } from '../services/oauthService';
import User from '../models/User';
import { readFile } from 'fs/promises';
import { join } from 'path';

const oauth = new Hono();

// GET /oauth/authorize
oauth.get('/authorize', async (c) => {
    const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = c.req.query();

    if (!client_id || !redirect_uri || response_type !== 'code') {
        return c.text('Invalid request parameters', 400);
    }

    const client = await validateClient(client_id, redirect_uri);
    if (!client) {
        return c.text('Invalid client or redirect URI', 400);
    }

    // In a real app, check session here. If logged in, skip to code generation.
    // For now, serve the login page.
    try {
        const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf-8');
        return c.html(loginHtml);
    } catch (e) {
        console.error('Error serving login page:', e);
        return c.text('Login page not found', 500);
    }
});

// POST /auth/login - Handles the login form submission
// Note: This is simplified. In a real app, this would be a separate auth controller.
// We'll attach it here for simplicity or route it in index.ts
oauth.post('/login-action', async (c) => { // Renamed slightly to avoid conflict if we mount separate auth router
    // This endpoint accepts form data
    const body = await c.req.parseBody();
    const { username, password, client_id, redirect_uri, state, code_challenge, code_challenge_method, scope } = body;

    // Validate User
    const user = await User.findOne({ username });
    // In production, compare hashed password
    if (!user || user.password !== password) {
        return c.redirect(`/oauth/authorize?error=access_denied&client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&state=${state}`);
    }

    // Generate Authorization Code
    const code = await createAuthorizationCode(
        user._id.toString(),
        client_id as string,
        redirect_uri as string,
        (scope as string || '').split(' '),
        code_challenge as string,
        code_challenge_method as string,
        state as string
    );

    // Redirect to callback
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append('code', code.code);
    if (state) redirectUrl.searchParams.append('state', state as string);

    return c.redirect(redirectUrl.toString());
});

// POST /oauth/token
oauth.post('/token', async (c) => {
    const body = await c.req.json(); // Handling JSON body
    const { grant_type, code, client_id, code_verifier, refresh_token } = body;

    try {
        if (grant_type === 'authorization_code') {
            const tokens = await exchangeCodeForToken(code, client_id, code_verifier);
            return c.json(tokens);
        } else if (grant_type === 'refresh_token') {
            // Implement refresh token logic here if needed
            return c.json({ error: 'unsupported_grant_type' }, 400);
        } else {
            return c.json({ error: 'unsupported_grant_type' }, 400);
        }
    } catch (error: any) {
        return c.json({ error: 'invalid_grant', error_description: error.message }, 400);
    }
});

export default oauth;
