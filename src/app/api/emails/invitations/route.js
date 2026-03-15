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

        const courseInfo = courseTitle ? `<h3 style="color: #2563eb;">${courseTitle}</h3>` : '';
        const descriptionInfo = courseDescription ? `<p>${courseDescription}</p>` : '';
        const defaultMessage = customMessage || 'We invite you to start your training with us.';

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Spinr LMS!</h2>
                <p>${defaultMessage}</p>
                ${courseInfo}
                ${descriptionInfo}
                <p>Please sign up to begin your training:</p>
                <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spinrlms.com'}/signup" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Sign Up Now</a></p>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">This is an automatic email from Spinr LMS.</p>
            </div>
        `;

        // Send individual emails with delay to respect rate limits
        let sentCount = 0;
        let failedCount = 0;

        // Resend free tier: 100 emails/day, 2 emails/second rate limit
        // Add 550ms delay between each email to stay under limit (550ms = ~1.8/sec)
        const EMAIL_DELAY_MS = 550;

        for (let i = 0; i < emailList.length; i++) {
            const email = emailList[i];

            try {
                const result = await sendEmailWithRetry(resend, {
                    from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <noreply@training.spinr.ca>',
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
                await delay(EMAIL_DELAY_MS);
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
