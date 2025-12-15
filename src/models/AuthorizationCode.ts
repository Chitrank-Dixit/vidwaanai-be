import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthorizationCode extends Document {
    code: string;
    clientId: string;
    userId: mongoose.Types.ObjectId;
    redirectUri: string;
    scope: string[];
    codeChallenge?: string;
    codeChallengeMethod?: string;
    state?: string;
    expiresAt: Date;
    used: boolean;
}

const AuthorizationCodeSchema = new Schema<IAuthorizationCode>(
    {
        code: { type: String, required: true, unique: true },
        clientId: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        redirectUri: { type: String, required: true },
        scope: [{ type: String }],
        codeChallenge: { type: String },
        codeChallengeMethod: { type: String },
        state: { type: String },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
        used: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IAuthorizationCode>('AuthorizationCode', AuthorizationCodeSchema);
