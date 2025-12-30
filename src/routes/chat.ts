import { Hono } from 'hono';
import { createConversation, getConversations, addMessage, getMessages } from '../services/chatService';

const chat = new Hono();

chat.get('/conversations', async (c) => {
    const user = c.get('user');
    const conversations = await getConversations(user.sub);
    return c.json({ conversations });
});

chat.post('/conversations', async (c) => {
    const user = c.get('user');
    console.log('[DEBUG] POST /conversations - User from context:', user);
    console.log('[DEBUG] POST /conversations - user.sub:', user?.sub);
    const { title, description, groupId } = await c.req.json();
    const conversation = await createConversation(user.sub, title, groupId, description);
    return c.json(conversation, 201);
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
