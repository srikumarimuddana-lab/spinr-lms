import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { promotionalTemplate, EmailConfig } from '@/lib/email';

const resend = new Resend(process.env.RESEND_API_KEY);

// Delay helper to respect rate limits (Resend allows 2 requests/second)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Send email with exponential backoff for rate limits
async function sendEmailWithRetry(resend, emailConfig, maxRetries = 3) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const { data, error } = await resend.emails.send(emailConfig);

            if (error) {
                // Check for rate limit error (429)
                if (error.statusCode === 429) {
                    const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    console.log(`Rate limit hit for ${emailConfig.to}, waiting ${waitTime}ms before retry...`);
                    await delay(waitTime);
                    continue;
                }
                return { error, data };
            }
            return { error: null, data };
        } catch (err) {
            if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`Error sending to ${emailConfig.to}, retrying in ${waitTime}ms...`);
                await delay(waitTime);
            } else {
                return { error: err, data: null };
            }
        }
    }
    return { error: new Error('Max retries exceeded'), data: null };
}

export async function POST(request) {
    try {
        const { subject, body, userIds, additionalEmails, preheader, ctaLink, ctaText } = await request.json();

        if (!subject || !body) {
            return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
        }

        // Get users from Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let emails = [];

        // Get selected users by IDs
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            const { data: users } = await supabase
                .from('lms_users')
                .select('email')
                .in('id', userIds);

            if (users) {
                emails = users.map(u => u.email).filter(Boolean);
            }
        }

        // Add additional emails
        if (additionalEmails && typeof additionalEmails === 'string') {
            const additionalList = additionalEmails
                .split(/[\n,]/)
                .map(e => e.trim().toLowerCase())
                .filter(e => e && e.includes('@'));

            // Add unique emails
            additionalList.forEach(email => {
                if (!emails.includes(email)) {
                    emails.push(email);
                }
            });
        }

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No valid email addresses found' }, { status: 400 });
        }

        // Build promotional email content
        const htmlBody = promotionalTemplate({
            subject,
            preheader,
            content: body,
            ctaButton: ctaLink ? {
                href: ctaLink,
                text: ctaText || 'Learn More',
            } : null,
            footerText: preheader || 'You received this email because you are subscribed to Spinr LMS updates.',
        });

        // Send individual emails with delay to respect rate limits
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];

            try {
                const result = await sendEmailWithRetry(resend, {
                    from: EmailConfig.from,
                    reply_to: EmailConfig.replyTo,
                    to: [email],
                    subject: subject,
                    html: htmlBody,
                });

                if (result.error) {
                    console.error('Resend error for', email, ':', result.error);
                    failedCount++;
                } else {
                    sentCount++;
                }
            } catch (err) {
                console.error('Exception sending to', email, ':', err);
                failedCount++;
            }

            // Add delay between emails (except after the last one)
            if (i < emails.length - 1) {
                await delay(EmailConfig.rateLimit.delayBetweenEmails);
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            total: emails.length,
            message: `Sent promotional email to ${sentCount} recipients${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        });

    } catch (error) {
        console.error('Promotional email error:', error);
        return NextResponse.json({ error: 'Failed to send promotional email' }, { status: 500 });
    }
}
