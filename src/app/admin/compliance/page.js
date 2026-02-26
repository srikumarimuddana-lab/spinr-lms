'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { FileCheck, Download, Search, LogIn, LogOut, Award, BookOpen, ClipboardList, UserPlus, AlertCircle } from 'lucide-react';

const ACTION_CONFIG = {
    driver_login: { label: 'Login', icon: LogIn, color: 'bg-blue-50 text-blue-700', description: (d) => `${d?.driver_name || 'Driver'} logged in` },
    driver_logout: { label: 'Logout', icon: LogOut, color: 'bg-gray-100 text-gray-700', description: (d) => `${d?.driver_name || 'Driver'} logged out` },
    account_created: { label: 'Signup', icon: UserPlus, color: 'bg-green-50 text-green-700', description: (d) => `${d?.full_name || d?.email || 'User'} created an account` },
    quiz_passed: { label: 'Quiz Passed', icon: ClipboardList, color: 'bg-green-50 text-green-700', description: (d) => `${d?.driver_name || 'Driver'} passed quiz with ${Math.round(d?.score || 0)}% (${d?.correct}/${d?.total})` },
    quiz_failed: { label: 'Quiz Failed', icon: ClipboardList, color: 'bg-red-50 text-red-700', description: (d) => `${d?.driver_name || 'Driver'} failed quiz with ${Math.round(d?.score || 0)}% (${d?.correct}/${d?.total})` },
    certificate_issued: { label: 'Certificate', icon: Award, color: 'bg-purple-50 text-purple-700', description: (d) => `Certificate ${d?.certificate_number} issued to ${d?.driver_name || 'driver'} for "${d?.course_title}"` },
    lesson_completed: { label: 'Lesson Done', icon: BookOpen, color: 'bg-blue-50 text-blue-700', description: (d) => `${d?.driver_name || 'Driver'} completed a lesson` },
};

function getActionConfig(action) {
    return ACTION_CONFIG[action] || {
        label: action?.replace(/_/g, ' ') || 'Unknown',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-600',
        description: (d) => JSON.stringify(d || {}),
    };
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
}

export default function AdminCompliancePage() {
    const [certificates, setCertificates] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [users, setUsers] = useState([]);
    const [tab, setTab] = useState('certificates');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const [certsRes, logsRes, usersRes] = await Promise.all([
            supabase.from('training_certificates').select('*').order('issued_at', { ascending: false }),
            supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
            supabase.from('lms_users').select('id, full_name, email'),
        ]);
        setCertificates(certsRes.data || []);
        setAuditLog(logsRes.data || []);
        setUsers(usersRes.data || []);
        setLoading(false);
    }

    function getUserName(userId) {
        const user = users.find((u) => u.id === userId);
        return user?.full_name || user?.email || 'Unknown';
    }

    function exportCSV() {
        const headers = ['Driver Name', 'Email', 'Course', 'Certificate #', 'Score', 'Status', 'Issued Date'];
        const rows = filteredCerts.map((c) => [c.driver_name, c.driver_email, c.course_title, c.certificate_number, Math.round(c.final_quiz_score || 0) + '%', c.status, new Date(c.issued_at).toLocaleDateString()]);
        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${v}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spinr-training-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportAuditCSV() {
        const headers = ['Time', 'Action', 'Driver', 'Description'];
        const rows = filteredLogs.map((log) => {
            const cfg = getActionConfig(log.action);
            return [
                new Date(log.created_at).toLocaleString(),
                cfg.label,
                log.details?.driver_name || log.details?.full_name || getUserName(log.user_id),
                cfg.description(log.details),
            ];
        });
        const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spinr-audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const filteredCerts = certificates.filter((c) => !search || c.driver_name?.toLowerCase().includes(search.toLowerCase()) || c.certificate_number?.toLowerCase().includes(search.toLowerCase()) || c.course_title?.toLowerCase().includes(search.toLowerCase()));

    const filteredLogs = auditLog.filter((l) => {
        if (!search) return true;
        const s = search.toLowerCase();
        const cfg = getActionConfig(l.action);
        return cfg.label.toLowerCase().includes(s)
            || l.details?.driver_name?.toLowerCase().includes(s)
            || l.details?.full_name?.toLowerCase().includes(s)
            || l.details?.email?.toLowerCase().includes(s)
            || getUserName(l.user_id).toLowerCase().includes(s);
    });

    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-xl sm:text-2xl font-bold">Compliance & Reports</h1>
                <button
                    onClick={tab === 'certificates' ? exportCSV : exportAuditCSV}
                    className="flex items-center gap-1.5 bg-[hsl(var(--primary))] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 touch-target"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[hsl(var(--secondary))] p-1 rounded-xl">
                <button onClick={() => setTab('certificates')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors touch-target ${tab === 'certificates' ? 'bg-white shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    Certificates ({certificates.length})
                </button>
                <button onClick={() => setTab('audit')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors touch-target ${tab === 'audit' ? 'bg-white shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>
                    Audit Log ({auditLog.length})
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === 'certificates' ? 'Search by driver, course, or certificate #...' : 'Search by driver name or action...'} className="w-full pl-10 pr-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm touch-target" />
            </div>

            {/* Certificates Tab */}
            {tab === 'certificates' && (
                <div className="space-y-2">
                    {filteredCerts.map((cert) => (
                        <div key={cert.id} className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">{cert.driver_name}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{cert.driver_email}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{cert.course_title}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cert.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {cert.status}
                                    </span>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{cert.certificate_number}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Score: {Math.round(cert.final_quiz_score || 0)}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredCerts.length === 0 && <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-8">No certificates found</p>}
                </div>
            )}

            {/* Audit Log Tab */}
            {tab === 'audit' && (
                <div className="space-y-2">
                    {filteredLogs.map((log) => {
                        const cfg = getActionConfig(log.action);
                        const Icon = cfg.icon;
                        const driverName = log.details?.driver_name || log.details?.full_name || getUserName(log.user_id);

                        return (
                            <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                                                <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">{driverName}</span>
                                            </div>
                                            <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0">{timeAgo(log.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{cfg.description(log.details)}</p>
                                        {log.details?.email && (
                                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{log.details.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredLogs.length === 0 && <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-8">No audit entries found</p>}
                </div>
            )}
        </div>
    );
}
