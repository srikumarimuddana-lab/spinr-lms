import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Fetch quiz questions without exposing correct answers
 * Uses Fisher-Yates shuffle for proper randomization
 */
export async function GET(request) {
    try {
        // Get authenticated user
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const quizId = searchParams.get('quizId');

        if (!quizId) {
            return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
        }

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

        // Get questions with options but exclude is_correct
        const { data: questions, error: questionsError } = await serviceClient
            .from('quiz_questions')
            .select('id, question_text, sort_order, quiz_options(id, option_text, sort_order)')
            .eq('quiz_id', quizId)
            .order('sort_order');

        if (questionsError) {
            return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
        }

        // Fisher-Yates shuffle for proper randomization
        function shuffle(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Shuffle and select up to 10 questions
        const shuffledQuestions = shuffle(questions || []);
        const selectedQuestions = shuffledQuestions.slice(0, 10);

        return NextResponse.json({
            quiz,
            questions: selectedQuestions,
        });

    } catch (error) {
        console.error('Quiz questions error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
