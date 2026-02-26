'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { toast } from 'sonner';
import { BookOpen, Users, ArrowRight } from 'lucide-react';

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadCourses();
    }, []);

    async function loadCourses() {
        const { data: { user } } = await supabase.auth.getUser();

        const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .eq('is_published', true)
            .order('sort_order');

        const { data: enrollData } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', user?.id);

        setCourses(coursesData || []);
        setEnrollments(enrollData || []);
        setLoading(false);
    }

    async function handleEnroll(courseId) {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase.from('enrollments').insert({
            user_id: user.id,
            course_id: courseId,
        });

        if (error) {
            toast.error('Failed to enroll');
        } else {
            toast.success('Enrolled successfully!');
            loadCourses();
        }
    }

    const getEnrollment = (courseId) => enrollments.find((e) => e.course_id === courseId);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold">Training Courses</h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Complete all required courses to get certified.</p>
            </div>

            {courses.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <BookOpen className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">No courses available</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Check back soon for new training courses.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {courses.map((course) => {
                        const enrollment = getEnrollment(course.id);
                        return (
                            <div key={course.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                <div className="h-2 bg-[hsl(var(--primary))]" />
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-semibold text-base">{course.title}</h3>
                                        {enrollment && (
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${enrollment.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                {enrollment.status === 'completed' ? 'Completed' : 'Enrolled'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-4">{course.description}</p>

                                    {enrollment ? (
                                        <Link
                                            href={`/dashboard/courses/${course.id}`}
                                            className="flex items-center justify-center gap-2 w-full bg-[hsl(var(--primary))] text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity touch-target"
                                        >
                                            {enrollment.status === 'completed' ? 'Review' : 'Continue'} <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => handleEnroll(course.id)}
                                            className="flex items-center justify-center gap-2 w-full bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] py-2.5 rounded-xl text-sm font-medium hover:bg-[hsl(var(--border))] transition-colors touch-target"
                                        >
                                            Enroll Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
