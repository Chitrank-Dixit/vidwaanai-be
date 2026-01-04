import { mock } from "bun:test";

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.OAUTH_CLIENT_ID = 'test-client-id';
process.env.OAUTH_CLIENT_SECRET = 'test-client-secret';
process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/callback';
process.env.AGENT_API_URL = 'http://mock-agent/api/v1/agent/query';

// Mock fetch for Agent API
const originalFetch = global.fetch;
global.fetch = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input instanceof Request ? input.url : '';

    if (urlStr.includes('agent/query')) {
        return new Response(JSON.stringify({
            answer: 'Mocked Agent Answer',
            sources: [],
            context: []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    return originalFetch(input, init);
});
