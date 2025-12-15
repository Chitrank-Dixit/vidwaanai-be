import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        description: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
