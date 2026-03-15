'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { MessageSquare, Send, Phone, Clock, CheckCircle, XCircle, RefreshCw, Loader2, Trash2 } from 'lucide-react';

export default function AdminSMSPage() {
    const [phones, setPhones] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState({ total: 0, sent: 0, failed: 0 });
    const [filter, setFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const supabase = createClient();

    const defaultMessage = `🚗 Hey! Complete your Spinr driver registration in 2 mins and start earning. 
Open the app: https://spinr.ca/signup?ref=sms 
Reply STOP to opt out.`;

    useEffect(() => {
        loadLogs();
    }, [filter]);

    async function loadLogs() {
        setRefreshing(true);
        try {
            const params = new URLSearchParams();
            params.set('limit', '100');
            if (filter !== 'all') {
                params.set('status', filter);
            }

            const response = await fetch(`/api/sms/reminders?${params}`);
            const data = await response.json();

            if (data.logs) {
                setLogs(data.logs);
            }
            if (data.summary) {
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setRefreshing(false);
        }
    }

    async function sendSMS() {
        // Parse phone numbers from textarea
        const phoneList = phones
            .split(/[\n,]/)  // Split by newline or comma
            .map(p => p.trim())
            .filter(p => p.length > 0);

        if (phoneList.length === 0) {
            toast.error('Please enter at least one phone number');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/sms/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phones: phoneList,
                    customMessage: customMessage || defaultMessage,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                setPhones('');
                setCustomMessage('');
                loadLogs();
            } else {
                toast.error(data.error || 'Failed to send SMS');
            }
        } catch (error) {
            console.error('SMS send error:', error);
            toast.error('Failed to send SMS');
        } finally {
            setLoading(false);
        }
    }

    async function retryFailed() {
        const failedPhones = logs
            .filter(log => log.status === 'failed')
            .map(log => log.phone);

        if (failedPhones.length === 0) {
            toast.info('No failed messages to retry');
            return;
        }

        setPhones(failedPhones.join('\n'));
        toast.info(`Ready to retry ${failedPhones.length} failed messages`);
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    SMS Reminders
                </h1>
                <button
                    onClick={loadLogs}
                    disabled={refreshing}
                    className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                    title="Refresh"
                >
                    {refreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                    <div className="text-sm text-blue-600/70">Total Sent</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-600">{summary.sent}</div>
                    <div className="text-sm text-green-600/70">Delivered</div>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                    <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                    <div className="text-sm text-red-600/70">Failed</div>
                </div>
            </div>

            {/* Send SMS Form */}
            <div className="bg-white rounded-xl shadow-sm border border-[hsl(var(--border))] p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send SMS Reminder
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Phone Numbers
                        </label>
                        <textarea
                            value={phones}
                            onChange={(e) => setPhones(e.target.value)}
                            placeholder="Enter phone numbers (one per line or comma-separated)&#10;Example:&#10;+1234567890&#10;+1987654321&#10;+15551234567"
                            className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-base"
                            rows={5}
                        />
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                            Enter numbers with country code (+1 for Canada/US) or without (will be formatted as +1)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            Message (leave empty for default)
                        </label>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder={defaultMessage}
                            className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-base"
                            rows={4}
                        />
                    </div>

                    <button
                        onClick={sendSMS}
                        disabled={loading || !phones.trim()}
                        className="w-full bg-[hsl(var(--primary))] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Send SMS Reminder
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* History */}
            <div className="bg-white rounded-xl shadow-sm border border-[hsl(var(--border))] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        SMS History
                    </h2>

                    <div className="flex items-center gap-2">
                        {summary.failed > 0 && (
                            <button
                                onClick={retryFailed}
                                className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Retry Failed
                            </button>
                        )}

                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-sm px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-white"
                        >
                            <option value="all">All</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                {logs.length === 0 ? (
                    <p className="text-[hsl(var(--muted-foreground))] text-center py-8">
                        No SMS history yet
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[hsl(var(--border))]">
                                    <th className="text-left py-3 px-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">Phone</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">Status</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">Sent At</th>
                                    <th className="text-left py-3 px-2 text-sm font-medium text-[hsl(var(--muted-foreground))]">Error</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-[hsl(var(--border))] last:border-0">
                                        <td className="py-3 px-2 font-mono text-sm">{log.phone}</td>
                                        <td className="py-3 px-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${log.status === 'sent' || log.status === 'delivered'
                                                    ? 'bg-green-50 text-green-700'
                                                    : log.status === 'failed'
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                {log.status === 'sent' || log.status === 'delivered' ? (
                                                    <CheckCircle className="w-3 h-3" />
                                                ) : log.status === 'failed' ? (
                                                    <XCircle className="w-3 h-3" />
                                                ) : (
                                                    <Clock className="w-3 h-3" />
                                                )}
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-sm text-[hsl(var(--muted-foreground))]">
                                            {formatDate(log.sent_at)}
                                        </td>
                                        <td className="py-3 px-2 text-sm text-red-600 max-w-[200px] truncate">
                                            {log.error_message || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
