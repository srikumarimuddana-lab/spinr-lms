'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Mail, Edit, Trash2, Plus, Eye, Save, X, Copy, Send, Code, Palette, Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, Loader2 } from 'lucide-react';

// Available template types
const TEMPLATE_TYPES = [
    { id: 'password_reset', name: 'Password Reset', category: 'Auth', subject: 'Reset Your Password - Spinr LMS' },
    { id: 'email_verification', name: 'Email Verification', category: 'Auth', subject: 'Verify Your Email - Spinr LMS' },
    { id: 'training_reminder', name: 'Training Reminder', category: 'Notifications', subject: 'Training Reminder - Action Required' },
    { id: 'course_invitation', name: 'Course Invitation', category: 'Notifications', subject: 'Invitation to Spinr LMS' },
    { id: 'promotional', name: 'Promotional Email', category: 'Marketing', subject: '' },
    { id: 'account_notification', name: 'Account Notification', category: 'Notifications', subject: '' },
];

// Default templates
const DEFAULT_TEMPLATES = {
    password_reset: {
        subject: 'Reset Your Password - Spinr LMS',
        html: `<h2>Reset Your Password</h2>

<p>Hi {{userName}},</p>

<p>We received a request to reset your password for your Spinr LMS account.</p>

<p>Click the button below to set a new password. This link will expire in 1 hour.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{resetLink}}"
         style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Reset Password
      </a>
    </td>
  </tr>
</table>

<p>If you didn't request this password reset, you can safely ignore this email.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  This is an automated message from Spinr LMS.<br>
  &copy; 2026 Spinr LMS. All rights reserved.
</p>`,
    },
    email_verification: {
        subject: 'Verify Your Email - Spinr LMS',
        html: `<h2>Verify Your Email</h2>

<p>Welcome to Spinr LMS!</p>

<p>Hi {{userName}},</p>

<p>Thanks for signing up! Please verify your email address to complete your registration.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{verificationLink}}"
         style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Verify Email
      </a>
    </td>
  </tr>
</table>

<p>If you didn't create an account, you can safely ignore this email.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  This is an automated message from Spinr LMS.<br>
  &copy; 2026 Spinr LMS. All rights reserved.
</p>`,
    },
    training_reminder: {
        subject: 'Training Reminder - Action Required',
        html: `<h2>Training Reminder</h2>

<p>Hi {{userName}},</p>

<p>This is a friendly reminder to complete your pending training.</p>

{{#courseTitle}}
<p><strong>Course:</strong> {{courseTitle}}</p>
{{/courseTitle}}

<p>Please log in to your training dashboard to continue:</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{dashboardLink}}"
         style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Training Dashboard
      </a>
    </td>
  </tr>
</table>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  This is an automated message from Spinr LMS.<br>
  &copy; 2026 Spinr LMS. All rights reserved.
</p>`,
    },
    course_invitation: {
        subject: 'Invitation to Spinr LMS',
        html: `<h2>Welcome to Spinr LMS!</h2>

<p>Hi {{userName}},</p>

<p>We invite you to start your training with us.</p>

{{#courseTitle}}
<h3 style="color: #2563eb;">{{courseTitle}}</h3>
{{/courseTitle}}

{{#courseDescription}}
<div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
  <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">{{courseDescription}}</p>
</div>
{{/courseDescription}}

<p>Please sign up to begin your training:</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{signupLink}}"
         style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Sign Up Now
      </a>
    </td>
  </tr>
</table>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  This is an automated message from Spinr LMS.<br>
  &copy; 2026 Spinr LMS. All rights reserved.
</p>`,
    },
};

export default function EmailTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [editMode, setEditMode] = useState('visual'); // 'visual' or 'html'
    const [selectedType, setSelectedType] = useState('');

    // Edit form state
    const [formData, setFormData] = useState({
        type: '',
        name: '',
        subject: '',
        html: '',
        is_active: true,
    });

    const supabase = createClient();

    useEffect(() => {
        loadTemplates();
    }, []);

    async function loadTemplates() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .order('type');

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast.error('Failed to load email templates');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        setFormData({
            type: selectedType || '',
            name: TEMPLATE_TYPES.find(t => t.id === selectedType)?.name || '',
            subject: TEMPLATE_TYPES.find(t => t.id === selectedType)?.subject || '',
            html: DEFAULT_TEMPLATES[selectedType]?.html || '',
            is_active: true,
        });
        setEditingTemplate('new');
    }

    async function handleEdit(template) {
        setFormData({
            type: template.type,
            name: template.name || TEMPLATE_TYPES.find(t => t.id === template.type)?.name || '',
            subject: template.subject,
            html: template.html,
            is_active: template.is_active,
        });
        setEditingTemplate(template.id);
    }

    async function handleDelete(template) {
        if (!confirm(`Delete the "${template.name || template.type}" email template?`)) return;

        try {
            const { error } = await supabase
                .from('email_templates')
                .delete()
                .eq('id', template.id);

            if (error) throw error;
            toast.success('Template deleted');
            loadTemplates();
        } catch (error) {
            toast.error('Failed to delete template: ' + error.message);
        }
    }

    async function handleSave() {
        if (!formData.type) {
            toast.error('Please select a template type');
            return;
        }

        try {
            if (editingTemplate === 'new') {
                // Check if template already exists
                const existing = templates.find(t => t.type === formData.type);
                if (existing) {
                    toast.error('Template type already exists. Edit the existing template instead.');
                    return;
                }

                const { error } = await supabase
                    .from('email_templates')
                    .insert({
                        type: formData.type,
                        name: formData.name,
                        subject: formData.subject,
                        html: formData.html,
                        is_active: formData.is_active,
                    });

                if (error) throw error;
                toast.success('Template created');
            } else {
                const { error } = await supabase
                    .from('email_templates')
                    .update({
                        name: formData.name,
                        subject: formData.subject,
                        html: formData.html,
                        is_active: formData.is_active,
                    })
                    .eq('id', editingTemplate);

                if (error) throw error;
                toast.success('Template updated');
            }

            setEditingTemplate(null);
            loadTemplates();
        } catch (error) {
            toast.error('Failed to save template: ' + error.message);
        }
    }

    async function handlePreview(template) {
        setPreviewTemplate(template);
    }

    async function handleResetToDefault(type) {
        const defaultTemplate = DEFAULT_TEMPLATES[type];
        if (!defaultTemplate) return;

        if (!confirm('This will reset the template to default. Continue?')) return;

        setFormData({
            ...formData,
            subject: defaultTemplate.subject,
            html: defaultTemplate.html,
        });
        toast.success('Template reset to default');
    }

    const getTemplateVariableHelp = (type) => {
        const variables = {
            password_reset: ['userName', 'resetLink'],
            email_verification: ['userName', 'verificationLink', 'confirmationCode'],
            training_reminder: ['userName', 'courseTitle', 'dashboardLink'],
            course_invitation: ['userName', 'courseTitle', 'courseDescription', 'signupLink'],
            promotional: ['subject', 'preheader', 'content', 'ctaButton'],
            account_notification: ['userName', 'subject', 'message'],
        };
        return variables[type] || [];
    };

    // Preview rendering
    const renderPreview = (html) => {
        // Replace template variables with sample values
        let preview = html
            .replace(/{{userName}}/g, 'John Doe')
            .replace(/{{resetLink}}/g, '#')
            .replace(/{{verificationLink}}/g, '#')
            .replace(/{{confirmationCode}}/g, 'ABC123')
            .replace(/{{courseTitle}}/g, 'Workplace Safety Training')
            .replace(/{{courseDescription}}/g, 'Learn about workplace safety best practices.')
            .replace(/{{dashboardLink}}/g, '#')
            .replace(/{{signupLink}}/g, '#')
            .replace(/{{subject}}/g, 'Sample Subject')
            .replace(/{{preheader}}/g, 'Sample preheader text')
            .replace(/{{content}}/g, '<p>Sample email content goes here.</p>')
            .replace(/{{message}}/g, 'This is a sample notification message.')
            .replace(/{{#courseTitle}}/g, '')
            .replace(/{{\/courseTitle}}/g, '')
            .replace(/{{#courseDescription}}/g, '')
            .replace(/{{\/courseDescription}}/g, '');

        return { __html: preview };
    };

    return (
        <div className="min-h-screen bg-[hsl(var(--secondary))]">
            {/* Header */}
            <div className="bg-white border-b border-[hsl(var(--border))]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[hsl(var(--primary))]/10 rounded-xl flex items-center justify-center">
                                <Mail className="w-5 h-5 text-[hsl(var(--primary))]" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Email Templates</h1>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    Manage email templates for authentication and notifications
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 bg-[hsl(var(--primary))] text-white px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            New Template
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Template Types Quick Select */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">Quick Add Template</h3>
                    <div className="flex flex-wrap gap-2">
                        {TEMPLATE_TYPES.map(type => {
                            const exists = templates.some(t => t.type === type.id);
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => { setSelectedType(type.id); handleCreate(); }}
                                    disabled={exists}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        exists
                                            ? 'bg-green-100 text-green-700 cursor-default'
                                            : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/10] text-[hsl(var(--foreground))]'
                                    }`}
                                >
                                    {exists ? '✓' : '+'} {type.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Templates List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl">
                        <Mail className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                        <p className="text-[hsl(var(--muted-foreground))] mb-4">
                            Create your first email template to get started
                        </p>
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
                        >
                            <Plus className="w-4 h-4" />
                            Create Template
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{template.name || template.type}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                template.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {template.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{template.type}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                                    Subject: {template.subject || '(none)'}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePreview(template)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/10] text-sm font-medium transition-colors"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/10] text-sm font-medium transition-colors"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleResetToDefault(template.type)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/10] text-sm font-medium transition-colors"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors ml-auto"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-4xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                            <h2 className="text-xl font-semibold">
                                {editingTemplate === 'new' ? 'Create Template' : 'Edit Template'}
                            </h2>
                            <button
                                onClick={() => setEditingTemplate(null)}
                                className="p-2 hover:bg-[hsl(var(--secondary))] rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {/* Template Type Selector (only for new templates) */}
                            {editingTemplate === 'new' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1.5">Template Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => {
                                            const type = TEMPLATE_TYPES.find(t => t.id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                type: e.target.value,
                                                name: type?.name || '',
                                                subject: type?.subject || '',
                                                html: DEFAULT_TEMPLATES[e.target.value]?.html || '',
                                            });
                                        }}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                    >
                                        <option value="">Select a template type...</option>
                                        {TEMPLATE_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Template Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1.5">Template Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Welcome Email"
                                    className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                />
                            </div>

                            {/* Subject */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1.5">Email Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Email subject line"
                                    className="w-full px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                                />
                            </div>

                            {/* Editor Mode Toggle */}
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium">Email Content</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditMode('visual')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            editMode === 'visual'
                                                ? 'bg-[hsl(var(--primary))] text-white'
                                                : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/10]'
                                        }`}
                                    >
                                        <Palette className="w-3.5 h-3.5" />
                                        Visual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditMode('html')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                            editMode === 'html'
                                                ? 'bg-[hsl(var(--primary))] text-white'
                                                : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary))/10]'
                                        }`}
                                    >
                                        <Code className="w-3.5 h-3.5" />
                                        HTML
                                    </button>
                                </div>
                            </div>

                            {/* HTML Editor */}
                            {editMode === 'html' ? (
                                <textarea
                                    value={formData.html}
                                    onChange={(e) => setFormData({ ...formData, html: e.target.value })}
                                    placeholder="Email HTML content..."
                                    rows={15}
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-mono text-sm"
                                />
                            ) : (
                                <RichTextEditor
                                    value={formData.html}
                                    onChange={(html) => setFormData({ ...formData, html })}
                                />
                            )}

                            {/* Template Variables Help */}
                            {formData.type && (
                                <div className="mt-4 p-4 bg-[hsl(var(--secondary))] rounded-xl">
                                    <p className="text-sm font-medium mb-2">Available Variables:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {getTemplateVariableHelp(formData.type).map(variable => (
                                            <span
                                                key={variable}
                                                className="px-2 py-1 bg-white rounded-md text-xs font-mono border border-[hsl(var(--border))]"
                                            >
                                                {`{{${variable}}}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Active Toggle */}
                            <div className="mt-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Active</p>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                        Enable or disable this template
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    className={`w-12 h-6 rounded-full transition-colors ${
                                        formData.is_active ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                                            formData.is_active ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                            <button
                                type="button"
                                onClick={() => setEditingTemplate(null)}
                                className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-white hover:bg-[hsl(var(--secondary))] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white hover:opacity-90 transition-opacity font-medium"
                            >
                                <Save className="w-4 h-4" />
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-3xl my-8 max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
                            <h2 className="text-xl font-semibold">
                                Preview: {previewTemplate.name || previewTemplate.type}
                            </h2>
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="p-2 hover:bg-[hsl(var(--secondary))] rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-4 pb-4 border-b border-[hsl(var(--border))]">
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Subject:</p>
                                <p className="font-medium">{previewTemplate.subject || '(no subject)'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">Preview:</p>
                                <div
                                    className="border border-[hsl(var(--border))] rounded-xl p-6 bg-white"
                                    dangerouslySetInnerHTML={renderPreview(previewTemplate.html)}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary))]">
                            <button
                                type="button"
                                onClick={() => setPreviewTemplate(null)}
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

// Rich Text Editor Component
function RichTextEditor({ value, onChange }) {
    const editorRef = null;

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    return (
        <div className="border border-[hsl(var(--border))] rounded-xl overflow-hidden">
            <div className="bg-[hsl(var(--secondary))] px-3 py-2 flex items-center gap-1 border-b border-[hsl(var(--border))] flex-wrap">
                <button type="button" onClick={() => execCommand('bold')} className="p-2 rounded hover:bg-white/50" title="Bold"><Bold className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCommand('italic')} className="p-2 rounded hover:bg-white/50" title="Italic"><Italic className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCommand('underline')} className="p-2 rounded hover:bg-white/50" title="Underline"><Underline className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-[hsl(var(--border))] mx-1" />
                <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 rounded hover:bg-white/50" title="Bullet List"><List className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 rounded hover:bg-white/50" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-[hsl(var(--border))] mx-1" />
                <button type="button" onClick={() => execCommand('formatBlock', 'H1')} className="p-2 rounded hover:bg-white/50 text-sm font-bold" title="Heading">H1</button>
                <button type="button" onClick={() => execCommand('formatBlock', 'H2')} className="p-2 rounded hover:bg-white/50 text-sm font-semibold" title="Subheading">H2</button>
                <button type="button" onClick={() => execCommand('formatBlock', 'P')} className="p-2 rounded hover:bg-white/50 text-sm" title="Paragraph">P</button>
                <div className="w-px h-6 bg-[hsl(var(--border))] mx-1" />
                <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 rounded hover:bg-white/50" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
                <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 rounded hover:bg-white/50" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Email HTML content..."
                rows={12}
                className="w-full px-4 py-3 font-mono text-sm focus:outline-none"
            />
        </div>
    );
}
