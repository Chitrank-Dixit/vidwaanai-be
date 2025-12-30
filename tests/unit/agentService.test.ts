import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { queryAgent, createAgentSession } from '../../src/services/agentService';

const MOCK_AGENT_URL = 'http://localhost:8001/api/v1/agent';

// Mock env var
process.env.AGENT_API_URL = `${MOCK_AGENT_URL}/query`;

describe('AgentService Unit Tests', () => {

    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    describe('createAgentSession', () => {
        it('should successfully create a session and return session_id', async () => {
            const mockResponse = {
                session_id: 'test-uuid-1234',
                created_at: new Date().toISOString()
            };

            global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify(mockResponse), { status: 200 })));

            const sessionId = await createAgentSession();
            expect(sessionId).toBe('test-uuid-1234');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should throw an error when API returns non-ok status', async () => {
            global.fetch = mock(() => Promise.resolve(new Response('Internal Server Error', { status: 500 })));

            expect(createAgentSession()).rejects.toThrow('Failed to create agent session: 500');
        });
    });

    describe('queryAgent', () => {
        it('should successfully query agent and return AgentResponse', async () => {
            const mockAgentResponse = {
                answer: 'This is a test answer',
                confidence: 0.95,
                sources: [],
                reasoning_trace: [],
                session_id: 'test-session',
                timestamp: new Date().toISOString(),
                processing_time_ms: 100
            };

            global.fetch = mock(() => Promise.resolve(new Response(JSON.stringify(mockAgentResponse), { status: 200 })));

            const response = await queryAgent('test question', 'test-session');
            expect(response.answer).toBe('This is a test answer');
            expect(response.confidence).toBe(0.95);
        });

        it('should throw an error when API returns non-ok status', async () => {
            // Mocking response with a text body, as the service attempts to read error text
            global.fetch = mock(() => Promise.resolve(new Response('Bad Request', { status: 400 })));

            expect(queryAgent('bad question', 'session')).rejects.toThrow('Agent API responded with status: 400');
        });
    });
});
