import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';

export const createConversation = async (userId: string, title: string, description?: string) => {
    return await Conversation.create({ userId, title, description });
};

export const getConversations = async (userId: string) => {
    return await Conversation.find({ userId }).sort({ createdAt: -1 });
};

export const addMessage = async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    return await Message.create({ conversationId, role, content });
};

export const getMessages = async (conversationId: string) => {
    return await Message.find({ conversationId }).sort({ createdAt: 1 });
};
