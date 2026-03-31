import { NextResponse } from 'next/server';
import { sendBulkEmails } from '@/lib/email/sender';

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

        const signupLink = `${process.env.NEXT_PUBLIC_SITE_URL || '/signup'}`;

        // Send using database template
        const result = await sendBulkEmails({
            recipients: emailList,
            templateType: 'course_invitation',
            variables: (email, index) => ({
                userName: email.split('@')[0], // Use part before @ as name
                courseTitle,
                courseDescription,
                customMessage: customMessage || '',
                signupLink,
            }),
        });

        if (result.error) {
            console.error('Email sending error:', result.error);
            return NextResponse.json({ error: 'Failed to send invitation emails' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            ...result,
            message: `Sent invitations to ${result.sentCount} email addresses${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`
        });

    } catch (error) {
        console.error('Invitation email error:', error);
        return NextResponse.json({ error: 'Failed to send invitation emails' }, { status: 500 });
    }
}
