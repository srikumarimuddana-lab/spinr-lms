import crypto from 'crypto';
import { EmailConfig } from './templates';

const SECRET = process.env.UNSUBSCRIBE_SECRET || 'spinr-unsubscribe-secret-change-me';

export function generateUnsubscribeToken(email) {
    return crypto
        .createHmac('sha256', SECRET)
        .update(email.toLowerCase().trim())
        .digest('base64url');
}

export function verifyUnsubscribeToken(email, token) {
    try {
        const expected = generateUnsubscribeToken(email);
        // timingSafeEqual prevents timing attacks
        const a = Buffer.from(token);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

export function buildUnsubscribeUrl(email) {
    const token = generateUnsubscribeToken(email.toLowerCase().trim());
    const params = new URLSearchParams({ email: email.toLowerCase().trim(), token });
    return `${EmailConfig.baseUrl}/api/unsubscribe?${params.toString()}`;
}
