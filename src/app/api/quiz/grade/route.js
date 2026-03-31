import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Server-side quiz grading endpoint
 * Grades quiz answers securely without exposing correct answers to the client
 */
export async function POST(request) {
    try {
        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { quizId, courseId, answers, questionIds } = await request.json();

        if (!quizId || !answers || !questionIds || !Array.isArray(questionIds)) {
            return NextResponse.json({ error: 'quizId, answers, and questionIds are required' }, { status: 400 });
        }

        // Use service client to access all quiz data
        const serviceClient = await createServiceClient();

        // Get quiz details
        const { data: quiz, error: quizError } = await serviceClient
            .from('quizzes')
            .select('id, title, passing_score, course_id')
            .eq('id', quizId)
            .single();

        if (quizError || !quiz) {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // Get only the questions that were actually shown to the user
        const { data: questions, error: questionsError } = await serviceClient
            .from('quiz_questions')
            .select('id, quiz_options(id, is_correct)')
            .eq('quiz_id', quizId)
            .in('id', questionIds);

        if (questionsError || !questions) {
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // Grade the answers server-side
        let correct = 0;
        const total = questions.length;

        questions.forEach((question) => {
            const selectedOptionId = answers[question.id];
            if (selectedOptionId) {
                const selectedOption = question.quiz_options.find((opt) => opt.id === selectedOptionId);
                if (selectedOption?.is_correct) {
                    correct++;
                }
            }
        });

        const score = total > 0 ? (correct / total) * 100 : 0;
        const passingScore = quiz.passing_score || 70;
        const passed = score >= passingScore;

        // Record the quiz attempt
        const { error: attemptError } = await serviceClient.from('quiz_attempts').insert({
            user_id: user.id,
            quiz_id: quizId,
            score,
            passed,
            answers,
        });

        if (attemptError) {
            console.error('Failed to record quiz attempt:', attemptError);
            // Continue even if recording fails - don't fail the whole request
        }

        // Get driver profile for audit log
        const { data: profile } = await serviceClient
            .from('lms_users')
            .select('full_name, email')
            .eq('id', user.id)
            .maybeSingle();

        // Write audit log
        await serviceClient.from('audit_log').insert({
            user_id: user.id,
            action: passed ? 'quiz_passed' : 'quiz_failed',
            entity_type: 'quiz',
            entity_id: quizId,
            details: {
                score,
                passed,
                correct,
                total,
                driver_name: profile?.full_name,
                email: profile?.email,
                quiz_title: quiz.title,
            },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({
            success: true,
            score,
            passed,
            correct,
            total,
            passingScore,
        });

    } catch (error) {
        console.error('Quiz grading error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
