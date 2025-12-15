import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
    userId: mongoose.Types.ObjectId;
    groupId?: mongoose.Types.ObjectId; // Optional for now as Group model doesn't exist yet
    title: string;
    description?: string;
    questionId?: mongoose.Types.ObjectId;
    answerId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        groupId: { type: mongoose.Schema.Types.ObjectId }, // No ref yet
        title: { type: String, required: true },
        description: { type: String },
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
        answerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    },
    { timestamps: true }
);

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
