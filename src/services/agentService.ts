import { Context } from 'hono';

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8001/api/v1/agent/query';

export interface AgentResponse {
    answer: string;
    confidence: number;
    sources: Array<{
        id: string;
        title: string;
        content: string;
    }>;
}

export const queryAgent = async (question: string, sessionId: string): Promise<AgentResponse> => {
    try {
        console.log(`[AgentService] Querying agent with question: "${question}" and sessionId: ${sessionId}`);
        const response = await fetch(AGENT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                session_id: sessionId,
            }),
        });

        if (!response.ok) {
            console.error(`[AgentService] Agent API error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`[AgentService] Error Body: ${errorText}`);
            throw new Error(`Agent API responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data as AgentResponse;
    } catch (error) {
        console.error('[AgentService] Error querying agent:', error);
        throw error;
    }
};

export const createAgentSession = async (): Promise<string> => {
    try {
        console.log('[AgentService] Creating new agent session');
        const response = await fetch(`${AGENT_API_URL.replace('/query', '/session/create')}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            console.error(`[AgentService] Create Session Error: ${response.status}`);
            const errorText = await response.text();
            console.error(`[AgentService] Create Session Error Body: ${errorText}`);
            throw new Error(`Failed to create agent session: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[AgentService] Created session ID: ${data.session_id}`);
        return data.session_id;
    } catch (error) {
        console.error('[AgentService] Error creating session:', error);
        throw error;
    }
};
