import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
const ACCESS_TOKEN_EXPIRY = process.env.OAUTH_TOKEN_EXPIRY ? parseInt(process.env.OAUTH_TOKEN_EXPIRY) : 900; // 15 mins

export const generateAccessToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

export const generateRefreshToken = (payload: object): string => {
    // Refresh tokens are opaque or long-lived JWTs. Using JWT for simplicity here but stored in DB.
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): any => {
    return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token: string): any => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};
