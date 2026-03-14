'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export default function QuizPage() {
    const { courseId, quizId } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const supabase = createClient();

    useEffect(() => { loadQuiz(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [quizId]);

    async function loadQuiz() {
        const { data: quizData } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
        const { data: questionsData } = await supabase
            .from('quiz_questions')
            .select('*, quiz_options(*)')
            .eq('quiz_id', quizId)
            .order('sort_order');

        setQuiz(quizData);
        // Randomize questions and select up to 10
        const shuffledQuestions = questionsData?.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffledQuestions?.slice(0, 10);
        setQuestions(selectedQuestions || []);
        setLoading(false);
    }

    function selectAnswer(questionId, optionId) {
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }

    async function submitQuiz() {
        if (Object.keys(answers).length < questions.length) {
            toast.error('Please answer all questions');
            return;
        }

        setSubmitting(true);
        let correct = 0;
        questions.forEach((q) => {
            const selectedOption = q.quiz_options.find((o) => o.id === answers[q.id]);
            if (selectedOption?.is_correct) correct++;
        });

        const score = (correct / questions.length) * 100;
        const passed = score >= (quiz?.passing_score || 70);

        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('quiz_attempts').insert({
            user_id: user.id,
            quiz_id: quizId,
            score,
            passed,
            answers,
        });

        // Get driver profile for audit log
        const { data: profile } = await supabase.from('lms_users').select('full_name, email').eq('id', user.id).maybeSingle();

        // Audit log
        await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: passed ? 'quiz_passed' : 'quiz_failed',
                entityType: 'quiz',
                entityId: quizId,
                details: { score, passed, correct, total: questions.length, driver_name: profile?.full_name, email: profile?.email, quiz_title: quiz?.title },
            }),
        });

        // If passed, check if all quizzes in course are passed → generate certificate
        if (passed) {
            await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });
        }

        setResult({ score, passed, correct, total: questions.length });
        setSubmitting(false);
    }

    function retry() {
        setAnswers({});
        setCurrentQ(0);
        setResult(null);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Results screen
    if (result) {
        return (
            <div className="space-y-6">
                <Link href={`/dashboard/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors touch-target">
                    <ArrowLeft className="w-4 h-4" /> Back to Course
                </Link>

                <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-green-50' : 'bg-red-50'}`}>
                        {result.passed ? (
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        ) : (
                            <XCircle className="w-10 h-10 text-red-500" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{result.passed ? 'Congratulations! 🎉' : 'Not Quite'}</h2>
                    <p className="text-[hsl(var(--muted-foreground))] text-sm mb-6">
                        {result.passed
                            ? 'You passed the quiz! Your progress has been recorded.'
                            : `You need ${quiz?.passing_score || 70}% to pass. Try again!`
                        }
                    </p>

                    <div className="bg-[hsl(var(--secondary))] rounded-xl p-4 mb-6 inline-block">
                        <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{Math.round(result.score)}%</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{result.correct} of {result.total} correct</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {!result.passed && (
                            <button
                                onClick={retry}
                                className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity touch-target"
                            >
                                <RotateCcw className="w-4 h-4" /> Try Again
                            </button>
                        )}
                        <Link
                            href={`/dashboard/courses/${courseId}`}
                            className="flex items-center justify-center gap-2 bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] px-6 py-3 rounded-xl font-medium hover:bg-[hsl(var(--border))] transition-colors touch-target"
                        >
                            Back to Course
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const question = questions[currentQ];

    return (
        <div className="space-y-6">
            <Link href={`/dashboard/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors touch-target">
                <ArrowLeft className="w-4 h-4" /> Back to Course
            </Link>

            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{quiz?.title}</h2>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] px-2.5 py-1 rounded-full">
                        {currentQ + 1} / {questions.length}
                    </span>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1.5 mb-6">
                    {questions.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${i === currentQ ? 'bg-[hsl(var(--primary))]' : answers[questions[i]?.id] ? 'bg-[hsl(var(--primary))]/40' : 'bg-[hsl(var(--border))]'
                                }`}
                        />
                    ))}
                </div>

                {/* Question */}
                <p className="text-base font-medium mb-5">{question?.question_text}</p>

                {/* Options */}
                <div className="space-y-2.5">
                    {question?.quiz_options?.sort((a, b) => a.sort_order - b.sort_order).map((option) => (
                        <button
                            key={option.id}
                            onClick={() => selectAnswer(question.id, option.id)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all touch-target text-sm ${answers[question.id] === option.id
                                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--foreground))]'
                                : 'border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]/30'
                                }`}
                        >
                            {option.option_text}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between gap-3">
                <button
                    onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                    disabled={currentQ === 0}
                    className="flex-1 bg-white border border-[hsl(var(--border))] py-3 rounded-xl text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors disabled:opacity-30 touch-target"
                >
                    Previous
                </button>
                {currentQ < questions.length - 1 ? (
                    <button
                        onClick={() => setCurrentQ(currentQ + 1)}
                        className="flex-1 bg-[hsl(var(--primary))] text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity touch-target"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={submitQuiz}
                        disabled={submitting}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 touch-target"
                    >
                        {submitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                )}
            </div>
        </div>
    );
}
