import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

        // Send emails in batches
        const batchSize = 100;
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < emailList.length; i += batchSize) {
            const batch = emailList.slice(i, i + batchSize);

            const { error } = await resend.emails.send({
                from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <noreply@training.spinr.ca>',
                to: batch,
                subject: courseTitle ? `Invitation: ${courseTitle}` : 'Invitation to Spinr LMS',
                html: htmlBody,
            });

            if (error) {
                console.error('Resend error:', error);
                failedCount += batch.length;
            } else {
                sentCount += batch.length;
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            total: emailList.length,
            message: `Sent invitations to ${sentCount} email addresses`
        });

    } catch (error) {
        console.error('Invitation email error:', error);
        return NextResponse.json({ error: 'Failed to send invitation emails' }, { status: 500 });
    }
}
