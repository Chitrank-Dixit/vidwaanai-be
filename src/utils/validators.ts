
export const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    // Standard RFC 5322 regex or similar
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

export const isValidPassword = (password: string): boolean => {
    if (!password) return false;
    // Min 8 chars, at least 1 number, 1 uppercase, 1 lowercase (implied usually)
    if (password.length < 8) return false;
    if (!/\d/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    return true;
};

export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    // Basic trimming and stripping of dangerous characters (simplified)
    // For real XSS protection, use a library like DOMPurify or similar, but for backend:
    // We just trim and maybe remove simple tags if needed.
    // Checklist says: XSS removal, whitespace trimming.

    let sanitized = input.trim();
    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
    // Remove other tags
    sanitized = sanitized.replace(/<[^>]*>?/gm, '');
    return sanitized;
};

export const isValidUrl = (url: string): boolean => {
    try {
        const u = new URL(url);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) {
        return false;
    }
};
