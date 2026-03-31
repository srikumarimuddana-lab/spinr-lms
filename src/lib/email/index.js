/**
 * Email Module for Spinr LMS
 *
 * Two ways to send emails:
 *
 * 1. Using Database Templates (Recommended):
 *    import { sendEmailFromTemplate, sendBulkEmails } from '@/lib/email';
 *
 *    const result = await sendEmailFromTemplate({
 *      to: 'user@example.com',
 *      templateType: 'password_reset',
 *      variables: { userName: 'John', resetLink: '...' },
 *    });
 *
 * 2. Using Template Functions (Legacy - hardcoded templates):
 *    import { templates, EmailConfig } from '@/lib/email';
 *
 *    const html = templates.passwordReset({ userName: 'John', resetLink: '...' });
 */

// Template functions (legacy)
export * from './templates';

// New database-driven sender
export {
    sendEmailFromTemplate,
    sendBulkEmails,
    getAvailableTemplates,
    getTemplateFromDb,
    substituteTemplateVariables,
} from './sender';
