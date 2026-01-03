import { Hono } from 'hono';
import { createConversation, getConversations, addMessage, getMessages, getConversationById, deleteConversation } from '../services/chatService';
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
    const messageId = c.req.query('messageId');
    if (!conversationId) return c.json({ error: 'conversationId required' }, 400);
    const messages = await getMessages(conversationId, messageId);
    return c.json({ messages });
});

chat.delete('/conversations/:conversationId', async (c) => {
    const user = c.get('user');
    const conversationId = c.req.param('conversationId');

    if (!conversationId) {
        return c.json({ error: 'Conversation ID required' }, 400);
    }

    try {
        const success = await deleteConversation(conversationId, user.sub);
        if (!success) {
            return c.json({ error: 'Conversation not found or unauthorized' }, 404);
        }
        return c.json({ message: 'Conversation deleted successfully' }, 200);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

chat.post('/messages', async (c) => {
    const { conversationId, text, role, isQuestion, isAnswer, followUpMessageId } = await c.req.json();

    try {
        // 1. Save the User's Message
        const userMessage = await addMessage(
            conversationId,
            role || 'user',
            text,
            isQuestion || (role === 'user'),
            isAnswer || (role === 'assistant'),
            followUpMessageId
        );

        // 2. If it's a user question, query the Agent
        let agentAnswer: string | null = null;
        if ((role === 'user' || !role) && (isQuestion || role === 'user')) {
            const conversation = await getConversationById(conversationId);
            if (conversation && conversation.agentSessionId) {
                try {
                    const agentResponse = await queryAgent(text, conversation.agentSessionId!);
                    agentAnswer = agentResponse.answer;
                    await addMessage(
                        conversationId,
                        'assistant',
                        agentResponse.answer,
                        false,
                        true
                    );
                } catch (err) {
                    console.error('[ChatRoute] Helper Agent Query Error:', err);
                }
            }
        }

        const responsePayload = userMessage.toObject ? { ...userMessage.toObject(), answer: agentAnswer } : { ...userMessage, answer: agentAnswer };
        return c.json(responsePayload, 201);
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

export default chat;
