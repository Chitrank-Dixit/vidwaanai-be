import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const getTestURI = () => {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vidwaan';
    // Use unique test database to allow parallel execution
    const uniqueId = randomUUID().split('-')[0];
    if (uri.includes('?')) {
        // insert before ?
        const parts = uri.split('?');
        return parts[0].replace(/\/vidwaan(?![a-zA-Z0-9_])/, `/vidwaan_test_${uniqueId}`) + '?' + parts[1];
    }
    return uri.replace(/\/vidwaan(?![a-zA-Z0-9_])/, `/vidwaan_test_${uniqueId}`);
};

export async function setupTestDB() {
    const uri = getTestURI();
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    await mongoose.connect(uri);
}

export async function teardownTestDB() {
    // await mongoose.connection.db.dropDatabase();
    // await mongoose.disconnect();
    // Keep connection open to avoid "Client must be connected" errors in parallel execution
}

export async function clearTestDB() {
    if (mongoose.connection.readyState === 0) return;
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}
