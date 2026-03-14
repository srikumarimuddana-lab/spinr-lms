'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Users, Shield, ShieldOff, ChevronDown, ChevronUp, CheckCircle, Clock, XCircle, Award, Search } from 'lucide-react';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [expandedUser, setExpandedUser] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers() {
        const [usersRes, enrollRes, certsRes, attemptsRes] = await Promise.all([
            supabase.from('lms_users').select('*').order('created_at', { ascending: false }),
            supabase.from('enrollments').select('*, courses(title)').order('enrolled_at', { ascending: false }),
            supabase.from('training_certificates').select('*'),
            supabase.from('quiz_attempts').select('*, quizzes(title, passing_score)').order('attempted_at', { ascending: false }),
        ]);
        setUsers(usersRes.data || []);
        setEnrollments(enrollRes.data || []);
        setCertificates(certsRes.data || []);
        setQuizAttempts(attemptsRes.data || []);
        setLoading(false);
    }

    async function toggleRole(user) {
        const newRole = user.role === 'admin' ? 'driver' : 'admin';
        if (!confirm(`${newRole === 'admin' ? 'Promote' : 'Demote'} ${user.full_name} to ${newRole}?`)) return;
        const { error } = await supabase.from('lms_users').update({ role: newRole }).eq('id', user.id);
        if (error) toast.error(error.message);
        else { toast.success(`${user.full_name} is now ${newRole}`); loadUsers(); }
    }

    function getUserEnrollments(userId) {
        return enrollments.filter((e) => e.user_id === userId);
    }

    function getUserCertificates(userId) {
        return certificates.filter((c) => c.user_id === userId);
    }

    function getUserQuizAttempts(userId) {
        return quizAttempts.filter((a) => a.user_id === userId);
    }

    function getDriverStatus(userId) {
        const enr = getUserEnrollments(userId);
        const certs = getUserCertificates(userId);
        if (certs.length > 0) return { label: 'Certified', color: 'bg-green-50 text-green-700', icon: Award };
        if (enr.some((e) => e.status === 'in_progress')) return { label: 'In Training', color: 'bg-amber-50 text-amber-700', icon: Clock };
        if (enr.length > 0) return { label: 'Enrolled', color: 'bg-blue-50 text-blue-700', icon: Clock };
        return { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: XCircle };
    }

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /></div>;

    const drivers = users.filter((u) => u.role === 'driver');
    const admins = users.filter((u) => u.role === 'admin');
    const certifiedCount = drivers.filter((u) => getUserCertificates(u.id).length > 0).length;
    const inTrainingCount = drivers.filter((u) => getUserEnrollments(u.id).some((e) => e.status === 'in_progress')).length;

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold">Users & Driver Status</h1>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Drivers', value: drivers.length, color: 'bg-blue-50 text-blue-600' },
                    { label: 'In Training', value: inTrainingCount, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Certified', value: certifiedCount, color: 'bg-green-50 text-green-600' },
                    { label: 'Admins', value: admins.length, color: 'bg-purple-50 text-purple-600' },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm text-center">
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or status..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm touch-target" />
            </div>

            {/* User List */}
            <div className="space-y-2">
                {users.filter((u) => {
                    if (!search) return true;
                    const s = search.toLowerCase();
                    const status = getDriverStatus(u.id);
                    return u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.role.includes(s) || status.label.toLowerCase().includes(s);
                }).map((user) => {
                    const status = getDriverStatus(user.id);
                    const isExpanded = expandedUser === user.id;
                    const userEnrollments = getUserEnrollments(user.id);
                    const userCerts = getUserCertificates(user.id);
                    const userAttempts = getUserQuizAttempts(user.id);
                    const StatusIcon = status.icon;

                    return (
                        <div key={user.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* Main Row */}
                            <div
                                className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-[hsl(var(--secondary))]/50 transition-colors touch-target"
                                onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                                        {user.full_name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {user.role === 'driver' && (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
                                            <StatusIcon className="w-3 h-3" /> {status.label}
                                        </span>
                                    )}
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {user.role}
                                    </span>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-[hsl(var(--border))] p-4 bg-[hsl(var(--secondary))]/30 space-y-4">
                                    {/* Info Row */}
                                    <div className="flex flex-wrap gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                                        <span>Joined: <strong className="text-[hsl(var(--foreground))]">{new Date(user.created_at).toLocaleDateString()}</strong></span>
                                        <span>Courses: <strong className="text-[hsl(var(--foreground))]">{userEnrollments.length}</strong></span>
                                        <span>Certificates: <strong className="text-[hsl(var(--foreground))]">{userCerts.length}</strong></span>
                                        <span>Quiz Attempts: <strong className="text-[hsl(var(--foreground))]">{userAttempts.length}</strong></span>
                                    </div>

                                    {/* Course Progress */}
                                    {userEnrollments.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-2">Course Progress</h4>
                                            <div className="space-y-2">
                                                {userEnrollments.map((enr) => (
                                                    <div key={enr.id} className="bg-white rounded-lg p-3">
                                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                                            <span className="text-sm font-medium truncate">{enr.courses?.title || 'Unknown Course'}</span>
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${enr.status === 'completed' ? 'bg-green-50 text-green-700'
                                                                : enr.status === 'in_progress' ? 'bg-amber-50 text-amber-700'
                                                                    : 'bg-blue-50 text-blue-700'
                                                                }`}>
                                                                {enr.status === 'completed' ? 'Completed' : enr.status === 'in_progress' ? 'In Progress' : 'Enrolled'}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-2 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                                                            <div className="h-full bg-[hsl(var(--primary))] rounded-full transition-all" style={{ width: `${enr.progress || 0}%` }} />
                                                        </div>
                                                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{Math.round(enr.progress || 0)}% complete</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quiz Attempts */}
                                    {userAttempts.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-2">Quiz Results</h4>
                                            <div className="space-y-1.5">
                                                {userAttempts.slice(0, 5).map((attempt) => (
                                                    <div key={attempt.id} className="bg-white rounded-lg p-3 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{attempt.quizzes?.title || 'Quiz'}</p>
                                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(attempt.attempted_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-sm font-bold">{Math.round(attempt.score)}%</span>
                                                            {attempt.passed ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Certificates */}
                                    {userCerts.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase mb-2">Certificates</h4>
                                            <div className="space-y-1.5">
                                                {userCerts.map((cert) => (
                                                    <div key={cert.id} className="bg-white rounded-lg p-3 flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{cert.course_title}</p>
                                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">#{cert.certificate_number}</p>
                                                        </div>
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 shrink-0">
                                                            {cert.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No activity */}
                                    {userEnrollments.length === 0 && userAttempts.length === 0 && (
                                        <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-2">No training activity yet</p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-[hsl(var(--border))]">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleRole(user); }}
                                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary))] transition-colors touch-target"
                                        >
                                            {user.role === 'admin' ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                                            {user.role === 'admin' ? 'Demote to Driver' : 'Promote to Admin'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
