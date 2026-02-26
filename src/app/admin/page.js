'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { Users, BookOpen, Award, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({ users: 0, courses: 0, certificates: 0, enrollments: 0 });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => { loadStats(); }, []);

    async function loadStats() {
        const [users, courses, certs, enrollments] = await Promise.all([
            supabase.from('lms_users').select('*', { count: 'exact', head: true }),
            supabase.from('courses').select('*', { count: 'exact', head: true }),
            supabase.from('training_certificates').select('*', { count: 'exact', head: true }),
            supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        ]);
        setStats({
            users: users.count || 0,
            courses: courses.count || 0,
            certificates: certs.count || 0,
            enrollments: enrollments.count || 0,
        });
        setLoading(false);
    }

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Drivers', value: stats.users, icon: Users, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'bg-purple-50 text-purple-600' },
                    { label: 'Enrollments', value: stats.enrollments, icon: Activity, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Certificates', value: stats.certificates, icon: Award, color: 'bg-green-50 text-green-600' },
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}><Icon className="w-5 h-5" /></div>
                            <p className="text-2xl font-bold">{s.value}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
