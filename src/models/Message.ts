import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
