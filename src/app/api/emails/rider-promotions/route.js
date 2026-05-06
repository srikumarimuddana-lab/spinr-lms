import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { sendBulkEmailsDirect } from '@/lib/email/sender';
import { riderPromotionalTemplate, EmailConfig } from '@/lib/email/templates';

const LOGO_URL = `${EmailConfig.baseUrl}/logo.png`;

// Derive promo sender from the existing verified domain — same domain, "Spinr" display name, promo@ local part
function buildPromoFrom() {
    if (process.env.EMAIL_FROM_PROMOTIONS) return process.env.EMAIL_FROM_PROMOTIONS;
    // Extract domain from e.g. "Spinr Training <noreply@training.spinr.ca>"
    const match = EmailConfig.from.match(/<[^@]+@([^>]+)>/);
    const domain = match ? match[1] : null;
    return domain ? `Spinr <promo@${domain}>` : EmailConfig.from;
}

export async function POST(request) {
    try {
        const auth = await requireAdmin();
        if (auth.response) return auth.response;

        const { couponCode, discountPercent, expiryDate, maxRides, appUrl, recipients: recipientsText } = await request.json();

        if (!couponCode?.trim() || !discountPercent || !recipientsText?.trim()) {
            return NextResponse.json(
                { error: 'couponCode, discountPercent, and recipients are required' },
                { status: 400 }
            );
        }

        // Parse "Name, email@example.com" — one per line
        const recipients = recipientsText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => {
                const lastComma = line.lastIndexOf(',');
                if (lastComma === -1) {
                    // No comma — treat the whole thing as an email if it looks like one
                    const email = line.trim().toLowerCase();
                    return email.includes('@') ? { name: '', email } : null;
                }
                const name = line.slice(0, lastComma).trim();
                const email = line.slice(lastComma + 1).trim().toLowerCase();
                return email.includes('@') ? { name, email } : null;
            })
            .filter(Boolean);

        if (recipients.length === 0) {
            return NextResponse.json(
                { error: 'No valid recipients found. Use format: Name, email@example.com (one per line)' },
                { status: 400 }
            );
        }

        // Discount % at the start — most visible in inbox preview
        const subjectFor = (recipient) => {
            const firstName = (recipient.name || '').split(/\s+/)[0].trim();
            return firstName
                ? `Claim it: ${discountPercent}% off your rides, ${firstName}`
                : `Claim it: ${discountPercent}% off your rides on Spinr`;
        };

        const result = await sendBulkEmailsDirect({
            recipients,
            subject: subjectFor,
            fromAddress: buildPromoFrom(),
            replyTo: process.env.EMAIL_REPLY_TO_PROMOTIONS || undefined,
            htmlFn: (recipient) =>
                riderPromotionalTemplate({
                    riderName: recipient.name || 'there',
                    couponCode: couponCode.trim().toUpperCase(),
                    discountPercent,
                    expiryDate: expiryDate || null,
                    maxRides: maxRides || null,
                    appUrl: appUrl?.trim() || '#',
                    logoUrl: LOGO_URL,
                }),
        });

        return NextResponse.json({
            success: true,
            ...result,
            message: `Sent to ${result.sentCount} rider(s)${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`,
        });
    } catch (error) {
        console.error('Rider promotions email error:', error);
        return NextResponse.json({ error: 'Failed to send rider promotion emails' }, { status: 500 });
    }
}
