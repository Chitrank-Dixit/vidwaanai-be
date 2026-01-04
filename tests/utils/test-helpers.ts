import { app } from '../../src/index';

export const testRequest = async (path: string, options?: RequestInit) => {
    return app.request(path, options);
};

export async function createTestUser(userData: any = {}) {
    const { default: User } = await import('../../src/models/User');
    const { AuthService } = await import('../../src/services/authService'); // Dynamic import to avoid cycles if any

    const email = userData.email || 'test@example.com';
    const password = userData.password || 'Password123!';
    const username = userData.username || email.split('@')[0];

    const passwordHash = await AuthService.hashPassword(password);

    const data = {
        email,
        username,
        fullName: userData.fullName || 'Test User',
        passwordHash,
        status: 'active',
        ...userData
    };
    // Remove plain password if it was passed in "userData" but meant for hashing
    delete data.password;

    const user = await User.create(data);
    return user;
}
