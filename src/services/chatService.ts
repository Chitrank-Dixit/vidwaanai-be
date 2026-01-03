import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';
import mongoose from 'mongoose';

export const createConversation = async (userId: string, title: string, groupId?: string, description?: string, _id?: string, agentSessionId?: string) => {
    return await Conversation.create({ _id, userId, title, groupId, description, agentSessionId });
};

export const getConversations = async (userId: string, page: number = 1, limit: number = 20) => {
    const skip = (page - 1) * limit;
    const total = await Conversation.countDocuments({ userId });
    const conversations = await Conversation.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return { conversations, total, page, limit };
};

const resolveConversationId = async (id: string): Promise<string | null> => {
    if (mongoose.Types.ObjectId.isValid(id)) return id;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
        console.warn(`[resolveConversationId] resolving UUID: ${id}`);
        const conv = await Conversation.findOne({ agentSessionId: id });
        return conv ? conv._id.toString() : null;
    }
    return null;
};

export const getConversationById = async (conversationId: string) => {
    const resolvedId = await resolveConversationId(conversationId);
    if (!resolvedId) return null;
    return await Conversation.findById(resolvedId);
};

export const addMessage = async (
    conversationId: string,
    role: 'user' | 'assistant',
    text: string,
    isQuestion: boolean = false,
    isAnswer: boolean = false,
    followUpMessageId?: string
) => {
    const resolvedId = await resolveConversationId(conversationId);
    if (!resolvedId) throw new Error(`Invalid conversation ID: ${conversationId}`);

    return await Message.create({ conversationId: resolvedId, role, text, isQuestion, isAnswer, followUpMessageId });
};

export const getMessages = async (conversationId: string, messageId?: string) => {
    const resolvedId = await resolveConversationId(conversationId);
    if (!resolvedId) return [];

    const query: any = { conversationId: resolvedId };
    if (messageId) {
        query.followUpMessageId = messageId;
    }

    return await Message.find(query).sort({ createdAt: 1 });
};

export const deleteConversation = async (conversationId: string, userId: string): Promise<boolean> => {
    const resolvedId = await resolveConversationId(conversationId);
    if (!resolvedId) return false;

    // Ensure the conversation belongs to the requesting user
    const conversation = await Conversation.findOne({ _id: resolvedId, userId });
    if (!conversation) return false;

    // Delete conversation and associated messages
    await Conversation.deleteOne({ _id: resolvedId });
    await Message.deleteMany({ conversationId: resolvedId });

    return true;
};
