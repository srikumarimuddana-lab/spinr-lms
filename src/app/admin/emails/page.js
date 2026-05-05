'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Mail, Send, Users, UserPlus, Clock, CheckCircle, Loader2, Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Download, FileSpreadsheet, Tag, Eye, X } from 'lucide-react';

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

    // Export state
    const [exportFilter, setExportFilter] = useState('all');
    const [exporting, setExporting] = useState(false);

    // Rider promotions state
    const COUPON_PRESETS = [
        { label: 'SPINR75 — 75% off', code: 'SPINR75', discount: 75 },
        { label: 'SPINR50 — 50% off', code: 'SPINR50', discount: 50 },
        { label: 'Custom', code: '', discount: '' },
    ];
    const [riderPreset, setRiderPreset] = useState(COUPON_PRESETS[0].label);
    const [riderCouponCode, setRiderCouponCode] = useState('SPINR75');
    const [riderDiscount, setRiderDiscount] = useState(75);
    const [riderExpiry, setRiderExpiry] = useState('');
    const [riderMaxRides, setRiderMaxRides] = useState('');
    const [riderAppUrl, setRiderAppUrl] = useState('');
    const [riderRecipients, setRiderRecipients] = useState('');
    const [showRiderPreview, setShowRiderPreview] = useState(false);

    function applyPreset(label) {
        setRiderPreset(label);
        const preset = COUPON_PRESETS.find(p => p.label === label);
        if (preset && preset.code) {
            setRiderCouponCode(preset.code);
            setRiderDiscount(preset.discount);
        }
    }

    function countRiderRecipients() {
        return riderRecipients
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.includes('@'))
            .length;
    }

    async function sendRiderPromotion() {
        if (!riderCouponCode.trim() || !riderDiscount || !riderRecipients.trim()) {
            toast.error('Please fill in coupon code, discount %, and recipients');
            return;
        }
        if (countRiderRecipients() === 0) {
            toast.error('No valid email addresses found in the recipients box');
            return;
        }
        setSending(true);
        try {
            const res = await fetch('/api/emails/rider-promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    couponCode: riderCouponCode.trim().toUpperCase(),
                    discountPercent: riderDiscount,
                    expiryDate: riderExpiry || null,
                    maxRides: riderMaxRides || null,
                    appUrl: riderAppUrl || null,
                    recipients: riderRecipients,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || `Sent to ${data.sentCount} riders`);
                setRiderRecipients('');
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch {
            toast.error('Failed to send rider promotion emails');
        }
        setSending(false);
    }

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

    async function exportUsers() {
        setExporting(true);
        try {
            // Get all users with their enrollments and certificates
            const [enrollmentsRes, certificatesRes, usersRes] = await Promise.all([
                supabase.from('enrollments').select('*, courses(title)'),
                supabase.from('training_certificates').select('*'),
                supabase.from('lms_users').select('id, email, full_name, role, created_at').eq('role', 'driver'),
            ]);

            const users = usersRes.data || [];
            const enrollments = enrollmentsRes.data || [];
            const certificates = certificatesRes.data || [];

            // Build user data with completion status
            const userData = users.map(user => {
                const userEnrollments = enrollments.filter(e => e.user_id === user.id);
                const userCerts = certificates.filter(c => c.user_id === user.id);

                const hasCompletedCourse = userEnrollments.some(e => e.status === 'completed');
                const hasCertificate = userCerts.length > 0;
                const isCompleted = hasCompletedCourse || hasCertificate;

                // Get course details
                const coursesList = userEnrollments.map(e => e.courses?.title || 'Unknown').join(', ');
                const progressList = userEnrollments.map(e => `${e.courses?.title || 'Unknown'}: ${Math.round(e.progress || 0)}%`).join('; ');

                return {
                    'Full Name': user.full_name,
                    'Email': user.email,
                    'Status': isCompleted ? 'Completed' : 'Not Completed',
                    'Courses': coursesList || 'None',
                    'Progress': progressList || 'N/A',
                    'Certificates': userCerts.map(c => c.certificate_number).join(', ') || 'None',
                    'Joined Date': new Date(user.created_at).toLocaleDateString(),
                };
            });

            // Filter based on selection
            let filteredData = userData;
            if (exportFilter === 'completed') {
                filteredData = userData.filter(u => u.Status === 'Completed');
            } else if (exportFilter === 'not_completed') {
                filteredData = userData.filter(u => u.Status === 'Not Completed');
            }

            // Convert to CSV
            const headers = Object.keys(filteredData[0] || {});
            const csvContent = [
                headers.join(','),
                ...filteredData.map(row =>
                    headers.map(header => {
                        const value = row[header] || '';
                        // Escape quotes and wrap in quotes if contains comma
                        const escaped = value.replace(/"/g, '""');
                        return escaped.includes(',') ? `"${escaped}"` : escaped;
                    }).join(',')
                )
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `user_list_${exportFilter}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exported ${filteredData.length} users`);
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export users');
        }
        setExporting(false);
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
        { id: 'rider-promotions', label: 'Rider Promotions', icon: Tag },
        { id: 'promotional', label: 'Promotional', icon: Mail },
        { id: 'reminders', label: 'Reminders', icon: Clock },
        { id: 'invitations', label: 'Invitations', icon: UserPlus },
        { id: 'export', label: 'Export Users', icon: Download },
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

                {/* Rider Promotions Tab */}
                {activeTab === 'rider-promotions' && (
                    <div className="space-y-5">
                        <div>
                            <h3 className="font-semibold mb-1">Send Rider Promotional Email</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Send coupon codes to your riders (customers). Paste names and emails below — one per line.
                            </p>
                        </div>

                        {/* Preset selector */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Coupon Preset</label>
                            <div className="flex flex-wrap gap-2">
                                {COUPON_PRESETS.map(preset => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => applyPreset(preset.label)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                                            riderPreset === preset.label
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-[hsl(var(--border))] hover:border-green-400 text-[hsl(var(--muted-foreground))]'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Code + Discount row */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Coupon Code</label>
                                <input
                                    type="text"
                                    value={riderCouponCode}
                                    onChange={(e) => { setRiderCouponCode(e.target.value.toUpperCase()); setRiderPreset('Custom'); }}
                                    placeholder="e.g. SPINR75"
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-mono uppercase"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Discount %</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={riderDiscount}
                                    onChange={(e) => { setRiderDiscount(e.target.value); setRiderPreset('Custom'); }}
                                    placeholder="e.g. 75"
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Expiry + Max rides + App URL */}
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Expiry Date <span className="text-[hsl(var(--muted-foreground))] font-normal">(optional)</span></label>
                                <input
                                    type="date"
                                    value={riderExpiry}
                                    onChange={(e) => setRiderExpiry(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Max Rides <span className="text-[hsl(var(--muted-foreground))] font-normal">(optional)</span></label>
                                <input
                                    type="number"
                                    min="1"
                                    value={riderMaxRides}
                                    onChange={(e) => setRiderMaxRides(e.target.value)}
                                    placeholder="e.g. 5"
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">App / Booking URL <span className="text-[hsl(var(--muted-foreground))] font-normal">(optional)</span></label>
                                <input
                                    type="url"
                                    value={riderAppUrl}
                                    onChange={(e) => setRiderAppUrl(e.target.value)}
                                    placeholder="https://spinr.ca"
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Recipients textarea */}
                        <div>
                            <label className="block text-sm font-medium mb-1.5">
                                Riders (Name &amp; Email)
                                <span className="text-[hsl(var(--muted-foreground))] font-normal ml-1">— one per line: <code className="bg-gray-100 px-1 rounded text-xs">Kiran, kiran@example.com</code></span>
                            </label>
                            <textarea
                                value={riderRecipients}
                                onChange={(e) => setRiderRecipients(e.target.value)}
                                placeholder={"Kiran Muddana, kiran@example.com\nJohn Smith, john@example.com\nsarah@example.com"}
                                rows={10}
                                className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-y font-mono"
                            />
                            {riderRecipients.trim() && (
                                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                    {countRiderRecipients()} valid rider(s) detected
                                </p>
                            )}
                        </div>

                        {/* Email preview panel */}
                        {showRiderPreview && (
                            <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                                <div className="bg-green-50 px-4 py-3 flex items-center justify-between border-b border-green-200">
                                    <span className="text-sm font-semibold text-green-800">Email Preview</span>
                                    <button onClick={() => setShowRiderPreview(false)} className="text-green-600 hover:text-green-800">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="bg-[#141414] p-4">
                                    {/* Simplified preview matching the real email design */}
                                    <div style={{ maxWidth: 560, margin: '0 auto', borderRadius: 16, overflow: 'hidden', fontFamily: 'system-ui,sans-serif' }}>
                                        {/* Hero */}
                                        <div style={{ background: '#000', padding: '28px 32px 24px' }}>
                                            <p style={{ margin: '0 0 20px', color: '#fff', fontSize: 16, fontWeight: 800, letterSpacing: 3 }}>SPINR</p>
                                            <h2 style={{ margin: '0 0 10px', color: '#86efac', fontSize: 32, fontWeight: 900, lineHeight: 1.15 }}>
                                                Enjoy {riderDiscount || '??'}% off<br />your rides!
                                            </h2>
                                            <p style={{ margin: '0 0 20px', color: '#e5e7eb', fontSize: 14, lineHeight: 1.6 }}>
                                                [Rider name], enjoy <strong style={{ color: '#86efac' }}>{riderDiscount || '??'}% off</strong>
                                                {riderMaxRides ? ` on ${riderMaxRides} trips` : ''}.
                                                {riderExpiry ? ` Valid until ${new Date(riderExpiry).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` : ''}
                                            </p>
                                            <span style={{ display: 'inline-block', background: '#fff', color: '#000', padding: '10px 28px', borderRadius: 50, fontWeight: 800, fontSize: 14 }}>Book a Ride</span>
                                        </div>
                                        {/* Coupon box */}
                                        <div style={{ background: '#000', padding: '0 32px 28px' }}>
                                            <div style={{ border: '2px dashed #22c55e', borderRadius: 12, padding: '18px 20px', textAlign: 'center', background: 'linear-gradient(135deg,#052e16,#14532d)' }}>
                                                <p style={{ margin: '0 0 4px', color: '#86efac', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3 }}>Your Promo Code</p>
                                                <p style={{ margin: 0, color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: 8, fontFamily: 'monospace' }}>
                                                    {riderCouponCode || 'CODE'}
                                                </p>
                                                <p style={{ margin: '6px 0 0', color: '#6ee7b7', fontSize: 12 }}>{riderDiscount || '??'}% discount — apply at checkout</p>
                                            </div>
                                        </div>
                                        {/* Features */}
                                        <div style={{ background: '#111', padding: '28px 32px', color: '#9ca3af', fontSize: 13 }}>
                                            <p style={{ margin: '0 0 4px', color: '#fff', fontSize: 18, fontWeight: 800 }}>Ride with Spinr, your way</p>
                                            <p style={{ margin: '0 0 16px', fontSize: 12, lineHeight: 1.6 }}>From your first trip of the morning to your last trip of the night...</p>
                                            {['🚗 Safe & reliable rides', '📍 Real-time tracking', '💰 Upfront, transparent pricing'].map(f => (
                                                <p key={f} style={{ margin: '0 0 8px', color: '#d1fae5', fontSize: 12 }}>• {f}</p>
                                            ))}
                                        </div>
                                        {/* Disclaimer */}
                                        <div style={{ background: '#0a0a0a', padding: '16px 32px', borderRadius: '0 0 16px 16px' }}>
                                            <p style={{ margin: 0, color: '#4b5563', fontSize: 10, lineHeight: 1.7 }}>
                                                This promotion is only valid for riders who received this email directly from Spinr.
                                                {riderExpiry ? ` Expires ${riderExpiry}.` : ''} Terms subject to change.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRiderPreview(v => !v)}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-green-500 text-green-700 text-sm font-medium hover:bg-green-50 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                {showRiderPreview ? 'Hide Preview' : 'Preview Email'}
                            </button>

                            <button
                                onClick={sendRiderPromotion}
                                disabled={sending || !riderCouponCode.trim() || !riderDiscount || countRiderRecipients() === 0}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send to {countRiderRecipients()} Rider{countRiderRecipients() !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                )}

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

                {/* Export Tab */}
                {activeTab === 'export' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-1">Export User List</h3>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Download user data with their training completion status</p>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => setExportFilter('all')}
                                className={`p-4 rounded-xl border-2 transition-colors ${exportFilter === 'all'
                                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5'
                                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50'
                                    }`}
                            >
                                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--primary))]" />
                                <p className="font-medium text-center">All Users</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">{allDrivers.length} total</p>
                            </button>

                            <button
                                onClick={() => setExportFilter('completed')}
                                className={`p-4 rounded-xl border-2 transition-colors ${exportFilter === 'completed'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-[hsl(var(--border))] hover:border-green-500/50'
                                    }`}
                            >
                                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <p className="font-medium text-center">Completed</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">Training done</p>
                            </button>

                            <button
                                onClick={() => setExportFilter('not_completed')}
                                className={`p-4 rounded-xl border-2 transition-colors ${exportFilter === 'not_completed'
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-[hsl(var(--border))] hover:border-amber-500/50'
                                    }`}
                            >
                                <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                                <p className="font-medium text-center">Not Completed</p>
                                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">Pending training</p>
                            </button>
                        </div>

                        <div className="bg-[hsl(var(--secondary))] rounded-xl p-4">
                            <h4 className="font-medium mb-2">Export includes:</h4>
                            <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                                <li>• Full Name</li>
                                <li>• Email Address</li>
                                <li>• Completion Status (Completed / Not Completed)</li>
                                <li>• Enrolled Courses</li>
                                <li>• Progress Percentage</li>
                                <li>• Certificate Numbers (if any)</li>
                                <li>• Join Date</li>
                            </ul>
                        </div>

                        <button
                            onClick={exportUsers}
                            disabled={exporting}
                            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Download CSV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
