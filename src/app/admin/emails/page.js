'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Mail, Send, Users, UserPlus, Clock, CheckCircle, Loader2, Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

function RichTextEditor({ value, onChange, placeholder }) {
    const editorRef = useRef(null);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        onChange(editorRef.current.innerHTML);
        editorRef.current.focus();
    };

    const handleImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const handleLink = () => {
        const url = prompt('Enter link URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    return (
        <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="bg-[hsl(var(--secondary))] px-3 py-2 flex items-center gap-1 border-b border-[hsl(var(--border))]">
                <button
                    type="button"
                    onClick={() => execCommand('bold')}
                    className="p-2 rounded hover:bg-white/50 transition-colors"
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('italic')}
                    className="p-2 rounded hover:bg-white/50 transition-colors"
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('underline')}
                    className="p-2 rounded hover:bg-white/50 transition-colors"
                    title="Underline"
                >
                    <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-[hsl(var(--border))] mx-1" />
                <button
                    type="button"
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-2 rounded hover:bg-white/50 transition-colors"
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-2 rounded hover:bg-white/50 transition-colors"
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-[hsl(var(--border))] mx-1" />
                <button
                    type="button"
                    onClick={handleImage}
                    className="p-2 rounded hover:bg-white/50 transition-colors"
                    title="Insert Image"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleLink}
                    className="p-2 rounded hover:bg-white/50 transition-colors"
                    title="Insert Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                className="w-full px-4 py-3 min-h-[200px] focus:outline-none prose prose-sm max-w-none"
                style={{ maxHeight: '300px', overflowY: 'auto' }}
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: value }}
            />
        </div>
    );
}

export default function AdminEmailsPage() {
    const [activeTab, setActiveTab] = useState('promotional');
    const [courses, setCourses] = useState([]);
    const [allDrivers, setAllDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Promotional state
    const [promoSubject, setPromoSubject] = useState('');
    const [promoBody, setPromoBody] = useState('');
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [additionalEmails, setAdditionalEmails] = useState('');

    // Reminders state
    const [pendingUsers, setPendingUsers] = useState([]);
    const [selectedReminderUsers, setSelectedReminderUsers] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [reminderMessage, setReminderMessage] = useState('');

    // Invitations state
    const [inviteEmails, setInviteEmails] = useState('');
    const [inviteCourse, setInviteCourse] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [coursesRes, enrollmentsRes, usersRes] = await Promise.all([
            supabase.from('courses').select('id, title, is_published').eq('is_published', true).order('title'),
            supabase.from('enrollments').select('*, courses(title)').in('status', ['enrolled', 'in_progress']),
            supabase.from('lms_users').select('id, email, full_name, role').eq('role', 'driver'),
        ]);

        setCourses(coursesRes.data || []);
        setAllDrivers(usersRes.data || []);

        // Get users with pending training
        const enrollments = enrollmentsRes.data || [];
        const users = usersRes.data || [];

        // Map enrollments to users
        const pendingMap = new Map();
        enrollments.forEach(enr => {
            if (!pendingMap.has(enr.user_id)) {
                const user = users.find(u => u.id === enr.user_id);
                if (user) {
                    pendingMap.set(enr.user_id, {
                        ...user,
                        enrollments: [],
                    });
                }
            }
            if (pendingMap.has(enr.user_id)) {
                pendingMap.get(enr.user_id).enrollments.push(enr);
            }
        });

        setPendingUsers(Array.from(pendingMap.values()));
        setLoading(false);
    }

    async function sendPromotionalEmail() {
        if (!promoSubject.trim() || !promoBody.trim()) {
            toast.error('Please enter subject and message');
            return;
        }

        if (selectedDrivers.length === 0 && !additionalEmails.trim()) {
            toast.error('Please select drivers or add additional emails');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/emails/promotional', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: promoSubject,
                    body: promoBody,
                    userIds: selectedDrivers,
                    additionalEmails: additionalEmails,
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Sent to ${data.sentCount} recipients`);
                setPromoSubject('');
                setPromoBody('');
                setSelectedDrivers([]);
                setAdditionalEmails('');
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch (error) {
            toast.error('Failed to send promotional email');
        }
        setSending(false);
    }

    async function sendReminders() {
        if (selectedReminderUsers.length === 0) {
            toast.error('Please select at least one user');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/emails/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: selectedReminderUsers,
                    courseId: selectedCourse || null,
                    customMessage: reminderMessage,
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Sent reminders to ${data.sentCount} users`);
                setSelectedReminderUsers([]);
                setReminderMessage('');
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch (error) {
            toast.error('Failed to send reminders');
        }
        setSending(false);
    }

    async function sendInvitations() {
        if (!inviteEmails.trim()) {
            toast.error('Please enter email addresses');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/emails/invitations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emails: inviteEmails,
                    courseId: inviteCourse || null,
                    customMessage: inviteMessage,
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success(`Sent invitations to ${data.sentCount} addresses`);
                setInviteEmails('');
                setInviteMessage('');
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch (error) {
            toast.error('Failed to send invitations');
        }
        setSending(false);
    }

    function toggleDriverSelection(userId) {
        setSelectedDrivers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    }

    function selectAllDrivers() {
        if (selectedDrivers.length === allDrivers.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(allDrivers.map(u => u.id));
        }
    }

    function toggleReminderUserSelection(userId) {
        setSelectedReminderUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    }

    function selectAllReminderUsers() {
        if (selectedReminderUsers.length === pendingUsers.length) {
            setSelectedReminderUsers([]);
        } else {
            setSelectedReminderUsers(pendingUsers.map(u => u.id));
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    const tabs = [
        { id: 'promotional', label: 'Promotional', icon: Mail },
        { id: 'reminders', label: 'Reminders', icon: Clock },
        { id: 'invitations', label: 'Invitations', icon: UserPlus },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-[hsl(var(--primary))]" />
                <h1 className="text-xl sm:text-2xl font-bold">Email Communications</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'bg-[hsl(var(--primary))] text-white'
                                    : 'bg-white text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl p-6 shadow-sm">

                {/* Promotional Tab */}
                {activeTab === 'promotional' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-1">Send Promotional Email</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Select drivers and/or add additional email addresses</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Subject</label>
                            <input
                                type="text"
                                value={promoSubject}
                                onChange={(e) => setPromoSubject(e.target.value)}
                                placeholder="Enter email subject..."
                                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Message</label>
                            <RichTextEditor
                                value={promoBody}
                                onChange={setPromoBody}
                                placeholder="Write your message here..."
                            />
                        </div>

                        {/* Driver Selection */}
                        <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden">
                            <div className="bg-[hsl(var(--secondary))] px-4 py-3 flex items-center justify-between">
                                <button
                                    onClick={selectAllDrivers}
                                    className="flex items-center gap-2 text-sm font-medium hover:text-[hsl(var(--primary))]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDrivers.length === allDrivers.length && allDrivers.length > 0}
                                        onChange={selectAllDrivers}
                                        className="w-4 h-4 rounded"
                                    />
                                    Select All Drivers ({allDrivers.length})
                                </button>
                                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                    {selectedDrivers.length} selected
                                </span>
                            </div>

                            <div className="max-h-48 overflow-y-auto">
                                {allDrivers.length === 0 ? (
                                    <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                                        <p>No drivers found!</p>
                                    </div>
                                ) : (
                                    allDrivers.map(user => (
                                        <div
                                            key={user.id}
                                            className="px-4 py-2 border-b border-[hsl(var(--border))] last:border-0 flex items-center gap-3 hover:bg-[hsl(var(--secondary))]/50 cursor-pointer"
                                            onClick={() => toggleDriverSelection(user.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDrivers.includes(user.id)}
                                                onChange={() => toggleDriverSelection(user.id)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{user.full_name}</p>
                                                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Additional Emails */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                Additional Email Addresses
                                <span className="text-[hsl(var(--muted-foreground))] font-normal ml-1">(not in the list - one per line)</span>
                            </label>
                            <textarea
                                value={additionalEmails}
                                onChange={(e) => setAdditionalEmails(e.target.value)}
                                placeholder="john@example.com&#10;jane@example.com"
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm resize-none font-mono"
                            />
                            {additionalEmails.trim() && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                    {additionalEmails.split(/[\n,]/).filter(e => e.trim().includes('@')).length} additional email(s)
                                </p>
                            )}
                        </div>

                        <button
                            onClick={sendPromotionalEmail}
                            disabled={sending || !promoSubject.trim() || !promoBody.trim() || (selectedDrivers.length === 0 && !additionalEmails.trim())}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send ({selectedDrivers.length + (additionalEmails.trim() ? additionalEmails.split(/[\n,]/).filter(e => e.trim().includes('@')).length : 0)} recipients)
                        </button>
                    </div>
                )}

                {/* Reminders Tab */}
                {activeTab === 'reminders' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-1">Send Training Reminders</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Remind users with pending training ({pendingUsers.length} users)
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Filter by Course (optional)</label>
                                <select
                                    value={selectedCourse}
                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                >
                                    <option value="">All Courses</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Custom Message (optional)</label>
                                <input
                                    type="text"
                                    value={reminderMessage}
                                    onChange={(e) => setReminderMessage(e.target.value)}
                                    placeholder="Add a custom message..."
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                        </div>

                        {/* User Selection */}
                        <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden">
                            <div className="bg-[hsl(var(--secondary))] px-4 py-3 flex items-center justify-between">
                                <button
                                    onClick={selectAllReminderUsers}
                                    className="flex items-center gap-2 text-sm font-medium hover:text-[hsl(var(--primary))]"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedReminderUsers.length === pendingUsers.length && pendingUsers.length > 0}
                                        onChange={selectAllReminderUsers}
                                        className="w-4 h-4 rounded"
                                    />
                                    Select All ({pendingUsers.length})
                                </button>
                                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                    {selectedReminderUsers.length} selected
                                </span>
                            </div>

                            <div className="max-h-64 overflow-y-auto">
                                {pendingUsers.length === 0 ? (
                                    <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                        <p>No pending training users found!</p>
                                    </div>
                                ) : (
                                    pendingUsers.map(user => {
                                        const filteredEnrollments = selectedCourse
                                            ? user.enrollments.filter(e => e.course_id === selectedCourse)
                                            : user.enrollments;

                                        if (selectedCourse && filteredEnrollments.length === 0) return null;

                                        return (
                                            <div
                                                key={user.id}
                                                className="px-4 py-3 border-b border-[hsl(var(--border))] last:border-0 flex items-start gap-3 hover:bg-[hsl(var(--secondary))]/50 cursor-pointer"
                                                onClick={() => toggleReminderUserSelection(user.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReminderUsers.includes(user.id)}
                                                    onChange={() => toggleReminderUserSelection(user.id)}
                                                    className="w-4 h-4 mt-1 rounded"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">{user.full_name}</p>
                                                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.email}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {filteredEnrollments.map((enr, idx) => (
                                                        <div key={idx} className="text-xs">
                                                            <span className={`px-1.5 py-0.5 rounded ${enr.status === 'in_progress'
                                                                ? 'bg-amber-50 text-amber-700'
                                                                : 'bg-blue-50 text-blue-700'
                                                                }`}>
                                                                {enr.status === 'in_progress' ? 'In Progress' : 'Enrolled'}
                                                            </span>
                                                            <span className="ml-1 text-[hsl(var(--muted-foreground))]">
                                                                {Math.round(enr.progress || 0)}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <button
                            onClick={sendReminders}
                            disabled={sending || selectedReminderUsers.length === 0}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Reminders ({selectedReminderUsers.length})
                        </button>
                    </div>
                )}

                {/* Invitations Tab */}
                {activeTab === 'invitations' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-1">Send Training Invitations</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Invite new contacts to start their training</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Select Course (optional)</label>
                                <select
                                    value={inviteCourse}
                                    onChange={(e) => setInviteCourse(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                >
                                    <option value="">General Invitation</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Custom Message (optional)</label>
                                <input
                                    type="text"
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Add a custom message..."
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                Email Addresses
                                <span className="text-[hsl(var(--muted-foreground))] font-normal ml-1">(one per line)</span>
                            </label>
                            <textarea
                                value={inviteEmails}
                                onChange={(e) => setInviteEmails(e.target.value)}
                                placeholder="john@example.com&#10;jane@example.com&#10;bob@example.com"
                                rows={8}
                                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm resize-none font-mono"
                            />
                            {inviteEmails.trim() && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                    {inviteEmails.split(/[\n,]/).filter(e => e.trim().includes('@')).length} valid email(s) detected
                                </p>
                            )}
                        </div>

                        <button
                            onClick={sendInvitations}
                            disabled={sending || !inviteEmails.trim()}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Invitations
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
