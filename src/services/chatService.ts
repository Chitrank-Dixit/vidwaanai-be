import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';

export const createConversation = async (userId: string, title: string, groupId?: string, description?: string, _id?: string, agentSessionId?: string) => {
    return await Conversation.create({ _id, userId, title, groupId, description, agentSessionId });
};

export const getConversations = async (userId: string) => {
    return await Conversation.find({ userId }).sort({ createdAt: -1 });
};

export const getConversationById = async (conversationId: string) => {
    return await Conversation.findById(conversationId);
};

export const addMessage = async (
    conversationId: string,
    role: 'user' | 'assistant',
    text: string,
    isQuestion: boolean = false,
    isAnswer: boolean = false,
    followUpMessageId?: string
) => {
    return await Message.create({ conversationId, role, text, isQuestion, isAnswer, followUpMessageId });
};

export const getMessages = async (conversationId: string) => {
    return await Message.find({ conversationId }).sort({ createdAt: 1 });
};
