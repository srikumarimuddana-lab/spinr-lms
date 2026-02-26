'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';

export default function LessonPage() {
    const { courseId, lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const [allLessons, setAllLessons] = useState([]);
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    async function loadLesson() {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', lessonId).single();
        const { data: allLessonsData } = await supabase.from('lessons').select('id, title, sort_order').eq('course_id', courseId).order('sort_order');
        const { data: progress } = await supabase.from('lesson_progress').select('*').eq('user_id', user?.id).eq('lesson_id', lessonId).maybeSingle();

        setLesson(lessonData);
        setAllLessons(allLessonsData || []);
        setCompleted(progress?.completed || false);
        setLoading(false);
    }

    async function markComplete() {
        setMarking(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('lesson_progress').upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

        if (error) {
            toast.error('Failed to mark as complete');
        } else {
            setCompleted(true);
            toast.success('Lesson completed! 🎉');

            // Update enrollment progress (lessons only — capped at 90%, quiz pass needed for 100%)
            const { data: allProgress } = await supabase.from('lesson_progress').select('*').eq('user_id', user.id).eq('completed', true);
            const completedLessons = allProgress?.filter((p) => allLessons.some((l) => l.id === p.lesson_id)).length || 0;
            const lessonProgress = allLessons.length > 0 ? (completedLessons / allLessons.length) * 90 : 0;

            await supabase.from('enrollments').update({
                progress: lessonProgress,
                status: 'in_progress',
            }).eq('user_id', user.id).eq('course_id', courseId);
        }
        setMarking(false);
    }

    const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link href={`/dashboard/courses/${courseId}`} className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors touch-target">
                <ArrowLeft className="w-4 h-4" /> Back to Course
            </Link>

            {/* Lesson Content */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] mb-2">
                    Lesson {currentIndex + 1} of {allLessons.length}
                    {completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold mb-6">{lesson?.title}</h1>

                {/* Lesson text content */}
                <div className="prose prose-sm sm:prose max-w-none text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap">
                    {lesson?.content}
                </div>
            </div>

            {/* Mark Complete */}
            {!completed && (
                <button
                    onClick={markComplete}
                    disabled={marking}
                    className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold text-base hover:bg-green-700 transition-colors disabled:opacity-50 touch-target flex items-center justify-center gap-2"
                >
                    <CheckCircle className="w-5 h-5" /> {marking ? 'Marking...' : 'Mark as Complete'}
                </button>
            )}

            {completed && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> You have completed this lesson
                    </p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-3">
                {prevLesson ? (
                    <Link
                        href={`/dashboard/courses/${courseId}/lessons/${prevLesson.id}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-[hsl(var(--border))] py-3 rounded-xl text-sm font-medium hover:bg-[hsl(var(--secondary))] transition-colors touch-target"
                    >
                        <ArrowLeft className="w-4 h-4" /> Previous
                    </Link>
                ) : <div className="flex-1" />}
                {nextLesson ? (
                    <Link
                        href={`/dashboard/courses/${courseId}/lessons/${nextLesson.id}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity touch-target"
                    >
                        Next <ArrowRight className="w-4 h-4" />
                    </Link>
                ) : (
                    <Link
                        href={`/dashboard/courses/${courseId}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--primary))] text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity touch-target"
                    >
                        Back to Course
                    </Link>
                )}
            </div>
        </div>
    );
}
