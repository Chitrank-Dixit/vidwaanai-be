import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    conversationId: mongoose.Types.ObjectId;
    role: 'user' | 'assistant' | 'system';
    text: string;
    isQuestion: boolean;
    isAnswer: boolean;
    followUpMessageId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        text: {
            type: String,
            required: true,
            validate: {
                validator: function (this: IMessage, v: string) {
                    if (this.isQuestion) {
                        return v.length <= 500;
                    } else if (this.isAnswer) {
                        return v.length <= 1000;
                    }
                    return true;
                },
                message: (props: any) => `Text length exceeds limit for role/type.`
            }
        },
        isQuestion: { type: Boolean, default: false },
        isAnswer: { type: Boolean, default: false },
        followUpMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    },
    { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
