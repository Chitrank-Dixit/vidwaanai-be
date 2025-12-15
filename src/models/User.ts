import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    displayName?: string;
    role: 'user' | 'admin';
    scopes: string[];
    oauthProviderId?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        displayName: { type: String },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        scopes: [{ type: String }],
        oauthProviderId: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
