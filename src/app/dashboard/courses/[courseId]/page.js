'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Circle, BookOpen, ClipboardList, ArrowLeft, Lock } from 'lucide-react';

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [lessonProgress, setLessonProgress] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadCourse();
    }, [courseId]);

    async function loadCourse() {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
        const { data: lessonsData } = await supabase.from('lessons').select('*').eq('course_id', courseId).order('sort_order');
        const { data: quizzesData } = await supabase.from('quizzes').select('*').eq('course_id', courseId).order('sort_order');
        const { data: progressData } = await supabase.from('lesson_progress').select('*').eq('user_id', user?.id);
        const { data: attemptsData } = await supabase.from('quiz_attempts').select('*').eq('user_id', user?.id);

        setCourse(courseData);
        setLessons(lessonsData || []);
        setQuizzes(quizzesData || []);
        setLessonProgress(progressData || []);
        setQuizAttempts(attemptsData || []);
        setLoading(false);
    }

    const isLessonComplete = (lessonId) => lessonProgress.some((p) => p.lesson_id === lessonId && p.completed);
    const getBestQuizScore = (quizId) => {
        const attempts = quizAttempts.filter((a) => a.quiz_id === quizId);
        if (attempts.length === 0) return null;
        return Math.max(...attempts.map((a) => a.score));
    };
    const hasPassedQuiz = (quizId) => quizAttempts.some((a) => a.quiz_id === quizId && a.passed);

    const completedLessons = lessons.filter((l) => isLessonComplete(l.id)).length;
    const nextLesson = lessons.find((l) => !isLessonComplete(l.id));
    const allLessonsComplete = lessons.length > 0 && lessons.every((l) => isLessonComplete(l.id));

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link href="/dashboard/courses" className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors touch-target">
                <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>

            {/* Course Header */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <h1 className="text-xl sm:text-2xl font-bold mb-2">{course?.title}</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{course?.description}</p>
                <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                    <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {lessons.length} Lessons</span>
                    <span className="flex items-center gap-1"><ClipboardList className="w-4 h-4" /> {quizzes.length} Quiz{quizzes.length !== 1 ? 'zes' : ''}</span>
                </div>
                {/* Progress */}
                {lessons.length > 0 && (
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1">
                            <span>{completedLessons} of {lessons.length} lessons complete</span>
                            <span>{Math.round((completedLessons / lessons.length) * 100)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[hsl(var(--primary))] rounded-full transition-all"
                                style={{ width: `${(completedLessons / lessons.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Continue Button */}
            {nextLesson && (
                <Link
                    href={`/dashboard/courses/${courseId}/lessons/${nextLesson.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-[hsl(var(--primary))] text-white py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity touch-target shadow-lg"
                >
                    Continue Learning
                </Link>
            )}

            {/* Lessons */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Lessons</h2>
                <div className="space-y-2">
                    {lessons.map((lesson, i) => {
                        const done = isLessonComplete(lesson.id);
                        return (
                            <Link
                                key={lesson.id}
                                href={`/dashboard/courses/${courseId}/lessons/${lesson.id}`}
                                className={`flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow touch-target ${done ? 'border-l-4 border-green-500' : ''}`}
                            >
                                {done ? (
                                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                                ) : (
                                    <Circle className="w-5 h-5 text-[hsl(var(--muted-foreground))] shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">Lesson {i + 1}: {lesson.title}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Quizzes */}
            {quizzes.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold mb-3">Quizzes</h2>
                    <div className="space-y-2">
                        {quizzes.map((quiz) => {
                            const bestScore = getBestQuizScore(quiz.id);
                            const passed = hasPassedQuiz(quiz.id);

                            // If lessons are not complete, show disabled quiz card
                            if (!allLessonsComplete) {
                                return (
                                    <div
                                        key={quiz.id}
                                        className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-4 shadow-sm opacity-60"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Lock className="w-5 h-5 shrink-0 text-gray-400" />
                                            <p className="text-sm font-medium truncate">{quiz.title}</p>
                                        </div>
                                        <span className="text-xs text-gray-500 shrink-0">Complete lessons first</span>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={quiz.id}
                                    href={`/dashboard/courses/${courseId}/quiz/${quiz.id}`}
                                    className={`flex items-center justify-between gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow touch-target ${passed ? 'border-l-4 border-green-500' : ''}`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <ClipboardList className={`w-5 h-5 shrink-0 ${passed ? 'text-green-500' : 'text-[hsl(var(--primary))]'}`} />
                                        <p className="text-sm font-medium truncate">{quiz.title}</p>
                                    </div>
                                    {bestScore !== null && (
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {Math.round(bestScore)}%
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
