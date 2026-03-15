import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

        // Send individual emails to each recipient
        let sentCount = 0;
        let failedCount = 0;

        for (const email of emails) {
            const { error } = await resend.emails.send({
                from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <noreply@training.spinr.ca>',
                to: [email], // Individual email to each recipient
                subject: courseTitle ? `Reminder: ${courseTitle}` : 'Training Reminder - Action Required',
                html: htmlBody,
            });

            if (error) {
                console.error('Resend error for', email, ':', error);
                failedCount++;
            } else {
                sentCount++;
            }
        }

        return NextResponse.json({
            success: true,
            sentCount,
            failedCount,
            message: `Sent reminder emails to ${sentCount} users`
        });

    } catch (error) {
        console.error('Reminder email error:', error);
        return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 });
    }
}
