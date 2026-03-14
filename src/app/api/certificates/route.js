import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

export async function POST(request) {
    try {
        const { courseId } = await request.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const serviceClient = await createServiceClient();

        // Check if all quizzes in the course are passed
        const { data: quizzes } = await serviceClient.from('quizzes').select('id').eq('course_id', courseId);
        if (!quizzes || quizzes.length === 0) return NextResponse.json({ message: 'No quizzes in course' });

        const { data: attempts } = await serviceClient.from('quiz_attempts').select('*').eq('user_id', user.id).in('quiz_id', quizzes.map((q) => q.id));

        const allPassed = quizzes.every((quiz) => attempts?.some((a) => a.quiz_id === quiz.id && a.passed));
        if (!allPassed) return NextResponse.json({ message: 'Not all quizzes passed yet' });

        // CRITICAL: Verify all lessons are completed before issuing certificate
        const { data: lessons } = await serviceClient.from('lessons').select('id').eq('course_id', courseId);
        if (!lessons || lessons.length === 0) return NextResponse.json({ message: 'No lessons in course' });

        // Check lesson progress for all lessons in the course
        const { data: progress } = await serviceClient.from('lesson_progress')
            .select('lesson_id, completed')
            .eq('user_id', user.id)
            .in('lesson_id', lessons.map((l) => l.id));

        // Verify all lessons are completed
        const allLessonsComplete = lessons.every((lesson) =>
            progress?.some((p) => p.lesson_id === lesson.id && p.completed)
        );
        if (!allLessonsComplete) return NextResponse.json({
            message: 'Complete all lessons before earning the certificate',
            error: 'lessons_not_completed'
        });

        // Check if certificate already exists
        const { data: existing } = await serviceClient.from('training_certificates').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
        if (existing) return NextResponse.json({ message: 'Certificate already issued' });

        // Get user and course details
        const { data: lmsUser } = await serviceClient.from('lms_users').select('*').eq('id', user.id).single();
        const { data: course } = await serviceClient.from('courses').select('*').eq('id', courseId).single();

        // Calculate best quiz score (average of best scores per quiz)
        const bestScores = quizzes.map((quiz) => {
            const quizAttempts = attempts.filter((a) => a.quiz_id === quiz.id && a.passed);
            return Math.max(...quizAttempts.map((a) => a.score));
        });
        const avgScore = bestScores.reduce((a, b) => a + b, 0) / bestScores.length;

        // Generate certificate number
        const year = new Date().getFullYear();
        const { count } = await serviceClient.from('training_certificates').select('*', { count: 'exact', head: true });
        const certNumber = `SPINR-CERT-${year}-${String((count || 0) + 1).padStart(5, '0')}`;

        // Insert certificate
        await serviceClient.from('training_certificates').insert({
            certificate_number: certNumber,
            user_id: user.id,
            course_id: courseId,
            driver_name: lmsUser.full_name,
            driver_email: lmsUser.email,
            course_title: course.title,
            final_quiz_score: avgScore,
            metadata: { quiz_count: quizzes.length, best_scores: bestScores },
        });

        // Update enrollment to completed
        await serviceClient.from('enrollments').update({
            status: 'completed',
            progress: 100,
            completed_at: new Date().toISOString(),
        }).eq('user_id', user.id).eq('course_id', courseId);

        // Audit log
        await serviceClient.from('audit_log').insert({
            user_id: user.id,
            action: 'certificate_issued',
            entity_type: 'certificate',
            details: { certificate_number: certNumber, course_title: course.title, score: avgScore },
        });

        return NextResponse.json({ success: true, certificateNumber: certNumber });
    } catch (error) {
        console.error('Certificate error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
