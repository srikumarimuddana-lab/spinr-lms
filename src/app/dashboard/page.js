'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { BookOpen, CheckCircle, Clock, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
    const [lmsUser, setLmsUser] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0 });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('lms_users').select('*').eq('id', user.id).maybeSingle();
        setLmsUser(profile);

        const { data: enrollData } = await supabase
            .from('enrollments')
            .select('*, courses(*)')
            .eq('user_id', user.id)
            .order('enrolled_at', { ascending: false });

        const enr = enrollData || [];
        setEnrollments(enr);
        setStats({
            total: enr.length,
            completed: enr.filter((e) => e.status === 'completed').length,
            inProgress: enr.filter((e) => e.status === 'in_progress' || e.status === 'enrolled').length,
        });
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-gradient-to-r from-[hsl(354,70%,54%)] to-[hsl(354,70%,45%)] rounded-2xl p-6 text-white">
                <h1 className="text-xl sm:text-2xl font-bold">
                    Welcome back, {lmsUser?.full_name?.split(' ')[0] || 'Driver'}! 👋
                </h1>
                <p className="text-white/70 text-sm mt-1">Continue your training to get certified.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                    { label: 'Enrolled', value: stats.total, icon: BookOpen, color: 'bg-blue-50 text-blue-600' },
                    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stat.value}</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Enrolled Courses */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">My Courses</h2>
                    <Link href="/dashboard/courses" className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
                        Browse All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {enrollments.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                        <BookOpen className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">No courses yet</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Browse available courses and start learning.</p>
                        <Link
                            href="/dashboard/courses"
                            className="inline-flex items-center justify-center bg-[hsl(var(--primary))] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity touch-target"
                        >
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {enrollments.map((enrollment) => (
                            <Link
                                key={enrollment.id}
                                href={`/dashboard/courses/${enrollment.course_id}`}
                                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow touch-target"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-sm truncate">{enrollment.courses?.title}</h3>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-1">{enrollment.courses?.description}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${enrollment.status === 'completed'
                                        ? 'bg-green-50 text-green-700'
                                        : enrollment.status === 'in_progress'
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-blue-50 text-blue-700'
                                        }`}>
                                        {enrollment.status === 'completed' ? 'Done' : enrollment.status === 'in_progress' ? 'In Progress' : 'Enrolled'}
                                    </span>
                                </div>
                                {/* Progress Bar */}
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1">
                                        <span>Progress</span>
                                        <span>{Math.round(enrollment.progress || 0)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[hsl(var(--primary))] rounded-full transition-all"
                                            style={{ width: `${enrollment.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
