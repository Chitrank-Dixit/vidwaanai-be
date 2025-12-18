import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    username: string; // Keeping username as it might be used internally or as email alias
    email: string;
    fullName: string;
    passwordHash: string;
    role: 'user' | 'admin' | 'moderator';
    scopes: string[];
    oauthProviderId?: string;
    status: 'active' | 'inactive' | 'suspended';
    emailVerified: boolean;
    emailVerificationToken?: string;
    passwordResetToken?: string;
    passwordResetTokenExpiry?: Date;
    preferences: Record<string, any>;
    lastLogin?: Date;
    isActive: boolean; // redundancy with status, but keeping for backward compat if any
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        fullName: { type: String, required: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
        scopes: [{ type: String }],
        oauthProviderId: { type: String },
        status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
        emailVerified: { type: Boolean, default: false },
        emailVerificationToken: { type: String },
        passwordResetToken: { type: String },
        passwordResetTokenExpiry: { type: Date },
        preferences: { type: Map, of: String, default: {} },
        lastLogin: { type: Date },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
