import { NextResponse } from 'next/server';
import { Resend } from 'resend';

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
        const { userIds, courseId, customMessage } = await request.json();

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
        }

        // Get users and their enrollment details
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Fetch users
        const { data: users, error: usersError } = await supabase
            .from('lms_users')
            .select('id, email, full_name')
            .in('id', userIds);

        if (usersError) {
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Fetch course details if courseId provided
        let courseTitle = '';
        if (courseId) {
            const { data: course } = await supabase
                .from('courses')
                .select('title')
                .eq('id', courseId)
                .single();
            if (course) courseTitle = course.title;
        }

        const emails = users.map(u => u.email).filter(Boolean);

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No valid emails found' }, { status: 400 });
        }

        // Build email content in English
        const courseInfo = courseTitle ? ` for the course: <strong>${courseTitle}</strong>` : '';
        const defaultMessage = customMessage || 'This is a friendly reminder to complete your pending training.';

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Training Reminder</h2>
                <p>${defaultMessage}</p>
                ${courseInfo ? `<p>${courseInfo}</p>` : ''}
                <p>Please log in to your training dashboard to continue:</p>
                <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spinrlms.com'}/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Go to Training Dashboard</a></p>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automatic reminder from Spinr LMS.</p>
            </div>
        `;

        // Send individual emails with delay to respect rate limits
        let sentCount = 0;
        let failedCount = 0;

        // Resend free tier: 100 emails/day, 2 emails/second rate limit
        // Add 550ms delay between each email to stay under limit (550ms = ~1.8/sec)
        const EMAIL_DELAY_MS = 550;

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];

            try {
                const result = await sendEmailWithRetry(resend, {
                    from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <noreply@training.spinr.ca>',
                    to: [email],
                    subject: courseTitle ? `Reminder: ${courseTitle}` : 'Training Reminder - Action Required',
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
                await delay(EMAIL_DELAY_MS);
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            total: emails.length,
            message: `Sent reminder emails to ${sentCount} users${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        });

    } catch (error) {
        console.error('Reminder email error:', error);
        return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 });
    }
}
