import { app } from '../../src/index';

export const testRequest = async (path: string, options?: RequestInit) => {
    return app.request(path, options);
};

export async function createTestUser(userData: any = {}) {
    // We can use the service or direct DB insertion here. 
    // Direct DB is safer to avoid circular dependencies if testing auth service.
    // Importing User model
    const { default: User } = await import('../../src/models/User');

    const defaultData = {
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
        preferredLanguage: 'en'
    };
    const data = { ...defaultData, ...userData };
    const user = await User.create(data);
    return user;
}
