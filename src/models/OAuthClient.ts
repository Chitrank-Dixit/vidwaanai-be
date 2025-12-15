import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthClient extends Document {
    clientId: string;
    clientSecret?: string;
    clientName: string;
    redirectUris: string[];
    allowedScopes: string[];
    grantTypes: string[];
    isPublic: boolean;
    createdAt: Date;
}

const OAuthClientSchema = new Schema<IOAuthClient>(
    {
        clientId: { type: String, required: true, unique: true },
        clientSecret: { type: String },
        clientName: { type: String, required: true },
        redirectUris: [{ type: String, required: true }],
        allowedScopes: [{ type: String }],
        grantTypes: [{ type: String }],
        isPublic: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IOAuthClient>('OAuthClient', OAuthClientSchema);
