import { Hono } from 'hono';
import { createConversation, getConversations, addMessage, getMessages } from '../services/chatService';
import { queryAgent, createAgentSession } from '../services/agentService';
import mongoose from 'mongoose';

const chat = new Hono();

chat.get('/conversations', async (c) => {
    const user = c.get('user');
    const conversations = await getConversations(user.sub);
    return c.json({ conversations });
});

chat.post('/conversations', async (c) => {
    const user = c.get('user');
    const { title, description, groupId, question, message } = await c.req.json();

    const userQuestion = question || message || title;
    if (!userQuestion) {
        return c.json({ error: 'Question or message is required' }, 400);
    }

    // Generate conversation ID upfront for DB
    const conversationId = new mongoose.Types.ObjectId().toString();

    try {
        // 1. Create Session with Agent
        const agentSessionId = await createAgentSession();

        // 2. Query Agent API
        const agentResponse = await queryAgent(userQuestion, agentSessionId);

        // 3. Asynchronously save to DB
        (async () => {
            try {
                await createConversation(
                    user.sub,
                    title || userQuestion.substring(0, 50),
                    groupId,
                    description,
                    conversationId,
                    agentSessionId // Pass Agent's UUID
                );
                await addMessage(conversationId, 'user', userQuestion, true, false);
                await addMessage(conversationId, 'assistant', agentResponse.answer, false, true);
            } catch (err) {
                console.error('Async DB Save Error:', err);
            }
        })();

        return c.json(agentResponse, 201);
    } catch (error: any) {
        console.error('Agent API Error:', error);
        return c.json({ error: 'Agent service unavailable or error', details: error.message }, 503);
    }
});

chat.get('/messages', async (c) => {
    const conversationId = c.req.query('conversationId');
    if (!conversationId) return c.json({ error: 'conversationId required' }, 400);
    const messages = await getMessages(conversationId);
    return c.json({ messages });
});

chat.post('/messages', async (c) => {
    const { conversationId, text, role, isQuestion, isAnswer, followUpMessageId } = await c.req.json();
    const message = await addMessage(
        conversationId,
        role || 'user',
        text,
        isQuestion || (role === 'user'),
        isAnswer || (role === 'assistant'),
        followUpMessageId
    );
    return c.json(message, 201);
});

export default chat;
