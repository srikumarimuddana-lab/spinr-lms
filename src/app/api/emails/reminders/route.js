import { NextResponse } from 'next/server';
import { sendBulkEmails, getAvailableTemplates } from '@/lib/email/sender';

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

        const dashboardLink = process.env.NEXT_PUBLIC_SITE_URL || '/dashboard';

        // Prepare recipients with per-user variables
        const recipients = users.map(u => u.email).filter(Boolean);
        const variables = (email, index) => {
            const user = users[index];
            return {
                userName: user?.full_name || email.split('@')[0],
                courseTitle,
                dashboardLink,
                ...(customMessage ? { customMessage } : {}),
            };
        };

        // Send using database template
        const result = await sendBulkEmails({
            recipients,
            templateType: 'training_reminder',
            variables,
        });

        if (result.error) {
            console.error('Email sending error:', result.error);
            return NextResponse.json({ error: 'Failed to send reminder emails' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            ...result,
            message: `Sent reminder emails to ${result.sentCount} users${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`
        });

    } catch (error) {
        console.error('Reminder email error:', error);
        return NextResponse.json({ error: 'Failed to send reminder email' }, { status: 500 });
    }
}

export async function GET() {
    const templates = await getAvailableTemplates();
    return NextResponse.json({ templates });
}
