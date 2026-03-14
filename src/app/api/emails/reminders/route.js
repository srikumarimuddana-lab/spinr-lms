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

        // Fetch enrollments to get status
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('user_id, status, progress, courses(title)')
            .in('user_id', userIds);

        const emails = users.map(u => u.email).filter(Boolean);

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No valid emails found' }, { status: 400 });
        }

        // Build email content
        const courseInfo = courseTitle ? ` for el curso: <strong>${courseTitle}</strong>` : '';
        const defaultMessage = customMessage || 'Esta es una cordial invitación para completar su capacitación pendiente.';

        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Recordatorio de Capacitación</h2>
                <p>${defaultMessage}</p>
                ${courseInfo ? `<p>${courseInfo}</p>` : ''}
                <p>Por favor, inicie sesión en su panel de capacitación para continuar:</p>
                <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://spinrlms.com'}/dashboard" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Ir al Panel de Capacitación</a></p>
                <p style="margin-top: 20px; color: #666; font-size: 12px;">Este es un recordatorio automático de Spinr LMS.</p>
            </div>
        `;

        // Send emails in batches
        const batchSize = 100;
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < emails.length; i += batchSize) {
            const batch = emails.slice(i, i + batchSize);

            const { error } = await resend.emails.send({
                from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <noreply@training.spinr.ca>',
                to: batch,
                subject: courseTitle ? `Recordatorio: ${courseTitle}` : 'Recordatorio de Capacitación Pendiente',
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
            message: `Sent reminder emails to ${sentCount} users`
        });

    } catch (error) {
        console.error('Reminder email error:', error);
        return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 });
    }
}
