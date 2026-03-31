import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { courseInvitationTemplate, EmailConfig } from '@/lib/email';

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
        const { emails, courseId, customMessage } = await request.json();

        // Parse emails from text area (one per line)
        const emailList = emails
            .split(/[\n,]/)
            .map(e => e.trim().toLowerCase())
            .filter(e => e && e.includes('@'));

        if (emailList.length === 0) {
            return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
        }

        // Get course details if courseId provided
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let courseTitle = '';
        let courseDescription = '';
        if (courseId) {
            const { data: course } = await supabase
                .from('courses')
                .select('title, description')
                .eq('id', courseId)
                .single();
            if (course) {
                courseTitle = course.title;
                courseDescription = course.description || '';
            }
        }

        const signupLink = `${EmailConfig.baseUrl}/signup`;

        // Send individual emails with delay to respect rate limits
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < emailList.length; i++) {
            const email = emailList[i];

            const htmlBody = courseInvitationTemplate({
                userName: email.split('@')[0], // Use part before @ as name
                courseTitle,
                courseDescription,
                customMessage,
                signupLink,
            });

            try {
                const result = await sendEmailWithRetry(resend, {
                    from: EmailConfig.from,
                    reply_to: EmailConfig.replyTo,
                    to: [email],
                    subject: courseTitle ? `Invitation: ${courseTitle}` : 'Invitation to Spinr LMS',
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
            if (i < emailList.length - 1) {
                await delay(EmailConfig.rateLimit.delayBetweenEmails);
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            total: emailList.length,
            message: `Sent invitations to ${sentCount} email addresses${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
        });

    } catch (error) {
        console.error('Invitation email error:', error);
        return NextResponse.json({ error: 'Failed to send invitation emails' }, { status: 500 });
    }
}
