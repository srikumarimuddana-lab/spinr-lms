import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { trainingReminderTemplate, EmailConfig } from '@/lib/email';

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

        const dashboardLink = `${EmailConfig.baseUrl}/dashboard`;

        // Send individual emails with delay to respect rate limits
        let sentCount = 0;
        let failedCount = 0;

        for (const user of users) {
            const email = user.email;
            if (!email) continue;

            const htmlBody = trainingReminderTemplate({
                userName: user.full_name,
                courseTitle,
                customMessage,
                dashboardLink,
            });

            try {
                const result = await sendEmailWithRetry(resend, {
                    from: EmailConfig.from,
                    reply_to: EmailConfig.replyTo,
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
            if (users.indexOf(user) < users.length - 1) {
                await delay(EmailConfig.rateLimit.delayBetweenEmails);
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            total: users.length,
            message: `Sent reminder emails to ${sentCount} users${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        });

    } catch (error) {
        console.error('Reminder email error:', error);
        return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 });
    }
}
