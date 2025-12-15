import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
    token: string;
    userId: mongoose.Types.ObjectId;
    clientId: string;
    scope: string[];
    expiresAt: Date;
    revokedAt?: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
    {
        token: { type: String, required: true, unique: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        clientId: { type: String, required: true },
        scope: [{ type: String }],
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
        revokedAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
