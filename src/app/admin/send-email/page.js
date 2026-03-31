'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Send, Users, FileText, Loader2, X, Plus, Eye } from 'lucide-react';

const TEMPLATE_VARIABLES = {
    password_reset: ['userName', 'resetLink'],
    email_verification: ['userName', 'verificationLink', 'confirmationCode'],
    training_reminder: ['userName', 'courseTitle', 'dashboardLink'],
    course_invitation: ['userName', 'courseTitle', 'courseDescription', 'signupLink'],
    promotional: ['subject', 'preheader', 'content', 'ctaButton'],
    account_notification: ['userName', 'subject', 'message'],
};

export default function SendEmailPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState([]);
    const [allDrivers, setAllDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form state
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [additionalEmails, setAdditionalEmails] = useState('');
    const [variables, setVariables] = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            // Fetch templates
            const templatesRes = await fetch('/api/emails/promotional');
            const templatesData = await templatesRes.json();
            setTemplates(templatesData.templates || []);

            // Fetch drivers
            const usersRes = await supabase
                .from('lms_users')
                .select('id, email, full_name, role')
                .eq('role', 'driver');
            setAllDrivers(usersRes.data || []);

            // Fetch courses for dropdown
            const coursesRes = await supabase
                .from('courses')
                .select('id, title')
                .eq('is_published', true);

            // Store courses in a ref for variable substitution
            window._adminEmailCourses = coursesRes.data || [];
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    const currentTemplate = templates.find(t => t.type === selectedTemplate);
    const currentVariables = TEMPLATE_VARIABLES[selectedTemplate] || [];

    function handleVariableChange(key, value) {
        setVariables(prev => ({ ...prev, [key]: value }));
    }

    function substituteVariables(html) {
        let result = html || '';

        // Handle conditional blocks
        Object.keys(TEMPLATE_VARIABLES).forEach(type => {
            TEMPLATE_VARIABLES[type].forEach(varName => {
                // Conditional blocks
                const condRegex = new RegExp(`\\{\\{#${varName}\\}\\}([\\s\\S]*?)\\{\\{\\/${varName}\\}\\}`, 'g');
                result = result.replace(condRegex, (match, content) => {
                    const value = variables[varName];
                    return value ? content : '';
                });

                // Simple variables
                const varRegex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
                result = result.replace(varRegex, variables[varName] || `[${varName}]`);
            });
        });

        // Also handle common non-template variables
        result = result.replace(/\[userName\]/g, variables.userName || 'John Doe');
        result = result.replace(/\[courseTitle\]/g, variables.courseTitle || 'Course Name');
        result = result.replace(/\[dashboardLink\]/g, variables.dashboardLink || '#');

        return result;
    }

    function handlePreview() {
        if (!currentTemplate) {
            toast.error('Please select a template');
            return;
        }
        setPreviewHtml(substituteVariables(currentTemplate.html));
        setShowPreview(true);
    }

    async function handleSend() {
        if (!selectedTemplate) {
            toast.error('Please select a template');
            return;
        }

        if (selectedUserIds.length === 0 && !additionalEmails.trim()) {
            toast.error('Please select users or add additional emails');
            return;
        }

        // Validate required variables
        const missingVars = currentVariables.filter(v => !variables[v] && v !== 'ctaButton');
        if (missingVars.length > 0) {
            toast.error(`Please fill in: ${missingVars.join(', ')}`);
            return;
        }

        setSending(true);
        try {
            let endpoint = '';
            let body = {};

            switch (selectedTemplate) {
                case 'training_reminder':
                    endpoint = '/api/emails/reminders';
                    body = {
                        userIds: selectedUserIds,
                        courseId: variables.courseId || null,
                        customMessage: variables.customMessage || '',
                    };
                    break;

                case 'course_invitation':
                    endpoint = '/api/emails/invitations';
                    body = {
                        emails: additionalEmails || selectedUserIds.map(id => {
                            const user = allDrivers.find(u => u.id === id);
                            return user?.email || '';
                        }).filter(Boolean).join('\n'),
                        courseId: variables.courseId || null,
                        customMessage: variables.customMessage || '',
                    };
                    break;

                case 'promotional':
                case 'account_notification':
                    endpoint = '/api/emails/promotional';
                    body = {
                        userIds: selectedUserIds,
                        additionalEmails: additionalEmails,
                        subject: variables.subject || currentTemplate?.subject || '',
                        body: variables.content || '',
                        preheader: variables.preheader || '',
                        ctaLink: variables.ctaLink || '',
                        ctaText: variables.ctaText || 'Learn More',
                    };
                    break;

                default:
                    // Generic send using template directly
                    endpoint = '/api/emails/send-from-template';
                    body = {
                        templateType: selectedTemplate,
                        recipients: [
                            ...selectedUserIds.map(id => {
                                const user = allDrivers.find(u => u.id === id);
                                return user?.email;
                            }).filter(Boolean),
                            ...additionalEmails.split(/[\n,]/).map(e => e.trim()).filter(e => e.includes('@')),
                        ],
                        variables,
                    };
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`Sent to ${data.sentCount} recipients`);
                // Reset form
                setSelectedTemplate('');
                setSelectedUserIds([]);
                setAdditionalEmails('');
                setVariables({});
            } else {
                toast.error(data.error || 'Failed to send');
            }
        } catch (error) {
            console.error('Send error:', error);
            toast.error('Failed to send email');
        } finally {
            setSending(false);
        }
    }

    function toggleUserSelection(userId) {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    }

    function selectAllUsers() {
        if (selectedUserIds.length === allDrivers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(allDrivers.map(u => u.id));
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-[hsl(var(--primary))]" />
                <h1 className="text-xl sm:text-2xl font-bold">Send Email from Template</h1>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                {/* Template Selection */}
                <div>
                    <label className="block text-sm font-medium mb-1.5">Select Email Template</label>
                    <select
                        value={selectedTemplate}
                        onChange={(e) => {
                            setSelectedTemplate(e.target.value);
                            setVariables({});
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                    >
                        <option value="">Choose a template...</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.type}>
                                {t.name || t.type} - {t.subject?.substring(0, 50)}{t.subject?.length > 50 ? '...' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedTemplate && (
                    <>
                        {/* Template Info */}
                        <div className="bg-[hsl(var(--secondary))] rounded-xl p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium">{currentTemplate?.name || selectedTemplate}</p>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                                        {currentTemplate?.subject}
                                    </p>
                                </div>
                                <button
                                    onClick={handlePreview}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-medium hover:bg-[hsl(var(--primary))]/20 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                            </div>
                        </div>

                        {/* Variables Input */}
                        {currentVariables.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Template Variables</h3>
                                <div className="space-y-3">
                                    {currentVariables.map(varName => {
                                        if (varName === 'ctaButton') return null; // Special case

                                        let label = varName;
                                        let placeholder = '';
                                        let type = 'text';

                                        // Customize input based on variable
                                        switch (varName) {
                                            case 'userName':
                                                label = 'User Name';
                                                placeholder = 'e.g., John Doe';
                                                break;
                                            case 'courseTitle':
                                                label = 'Course Title';
                                                placeholder = 'e.g., Workplace Safety Training';
                                                break;
                                            case 'courseDescription':
                                                label = 'Course Description';
                                                placeholder = 'Brief description...';
                                                type = 'textarea';
                                                break;
                                            case 'dashboardLink':
                                                label = 'Dashboard URL';
                                                placeholder = 'https://spinrlms.com/dashboard';
                                                type = 'url';
                                                break;
                                            case 'signupLink':
                                                label = 'Signup URL';
                                                placeholder = 'https://spinrlms.com/signup';
                                                type = 'url';
                                                break;
                                            case 'resetLink':
                                            case 'verificationLink':
                                                label = varName.replace(/([A-Z])/g, ' $1').trim();
                                                placeholder = 'URL (usually auto-filled)';
                                                type = 'url';
                                                break;
                                            case 'confirmationCode':
                                                label = 'Confirmation Code';
                                                placeholder = 'e.g., ABC123';
                                                break;
                                            case 'subject':
                                                label = 'Email Subject';
                                                placeholder = 'Email subject line';
                                                break;
                                            case 'preheader':
                                                label = 'Preheader (preview text)';
                                                placeholder = 'Short preview text...';
                                                break;
                                            case 'content':
                                                label = 'Email Body (HTML)';
                                                placeholder = '<p>Your message here...</p>';
                                                type = 'textarea';
                                                break;
                                            case 'message':
                                                label = 'Message';
                                                placeholder = 'Your message...';
                                                type = 'textarea';
                                                break;
                                            default:
                                                label = varName.replace(/([A-Z])/g, ' $1').trim();
                                                placeholder = `Enter ${varName}...`;
                                        }

                                        return (
                                            <div key={varName}>
                                                <label className="block text-sm font-medium mb-1.5">{label}</label>
                                                {type === 'textarea' ? (
                                                    <textarea
                                                        value={variables[varName] || ''}
                                                        onChange={(e) => handleVariableChange(varName, e.target.value)}
                                                        placeholder={placeholder}
                                                        rows={4}
                                                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm resize-none"
                                                    />
                                                ) : (
                                                    <input
                                                        type={type}
                                                        value={variables[varName] || ''}
                                                        onChange={(e) => handleVariableChange(varName, e.target.value)}
                                                        placeholder={placeholder}
                                                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Course Selection (for reminders/invitations) */}
                        {(selectedTemplate === 'training_reminder' || selectedTemplate === 'course_invitation') && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Select Course (optional)</label>
                                <select
                                    value={variables.courseId || ''}
                                    onChange={(e) => handleVariableChange('courseId', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                >
                                    <option value="">No course specified</option>
                                    {window._adminEmailCourses?.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Custom Message */}
                        {(selectedTemplate === 'training_reminder' || selectedTemplate === 'course_invitation') && (
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Custom Message (optional)</label>
                                <textarea
                                    value={variables.customMessage || ''}
                                    onChange={(e) => handleVariableChange('customMessage', e.target.value)}
                                    placeholder="Add a personal touch..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm resize-none"
                                />
                            </div>
                        )}

                        {/* CTA Button Fields (for promotional) */}
                        {selectedTemplate === 'promotional' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Content (HTML)</label>
                                    <textarea
                                        value={variables.content || ''}
                                        onChange={(e) => handleVariableChange('content', e.target.value)}
                                        placeholder="<p>Your email content here...</p>"
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm resize-none font-mono"
                                    />
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">CTA Link (optional)</label>
                                        <input
                                            type="url"
                                            value={variables.ctaLink || ''}
                                            onChange={(e) => handleVariableChange('ctaLink', e.target.value)}
                                            placeholder="https://spinrlms.com/courses"
                                            className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">CTA Button Text</label>
                                        <input
                                            type="text"
                                            value={variables.ctaText || ''}
                                            onChange={(e) => handleVariableChange('ctaText', e.target.value)}
                                            placeholder="e.g., View Course"
                                            className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Recipient Selection */}
                        <div>
                            <h3 className="font-semibold mb-3">Recipients</h3>

                            {/* User Selection */}
                            <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden mb-4">
                                <div className="bg-[hsl(var(--secondary))] px-4 py-3 flex items-center justify-between">
                                    <button
                                        onClick={selectAllUsers}
                                        className="flex items-center gap-2 text-sm font-medium hover:text-[hsl(var(--primary))]"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.length === allDrivers.length && allDrivers.length > 0}
                                            onChange={selectAllUsers}
                                            className="w-4 h-4 rounded"
                                        />
                                        Select All Drivers ({allDrivers.length})
                                    </button>
                                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                        {selectedUserIds.length} selected
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
                                                onClick={() => toggleUserSelection(user.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onChange={() => toggleUserSelection(user.id)}
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
                                    <span className="text-[hsl(var(--muted-foreground))] font-normal ml-1">(one per line)</span>
                                </label>
                                <textarea
                                    value={additionalEmails}
                                    onChange={(e) => setAdditionalEmails(e.target.value)}
                                    placeholder="john@example.com&#10;jane@example.com"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-sm resize-none font-mono"
                                />
                                {additionalEmails.trim() && (
                                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                                        {additionalEmails.split(/[\n,]/).filter(e => e.trim().includes('@')).length} additional email(s)
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-[hsl(var(--border))]">
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Send Email
                            </button>
                            <button
                                onClick={handlePreview}
                                className="flex items-center gap-2 px-6 py-3 bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] rounded-xl font-medium hover:bg-[hsl(var(--secondary))]/80 transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                Preview
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-3xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                            <h2 className="text-xl font-semibold">
                                Preview: {currentTemplate?.name || selectedTemplate}
                            </h2>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-[hsl(var(--secondary))] rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-4 pb-4 border-b border-[hsl(var(--border))]">
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Subject:</p>
                                <p className="font-medium">{variables.subject || currentTemplate?.subject || '(no subject)'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">Preview:</p>
                                <div
                                    className="border border-[hsl(var(--border))] rounded-xl p-6 bg-white prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))]">
                            <button
                                type="button"
                                onClick={() => setShowPreview(false)}
                                className="px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white hover:opacity-90 transition-opacity font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
