/**
 * Email Sender Module
 *
 * Sends emails using templates from the database with variable substitution.
 *
 * Usage:
 *   import { sendEmailFromTemplate } from '@/lib/email/sender';
 *
 *   const result = await sendEmailFromTemplate({
 *     to: 'user@example.com',
 *     templateType: 'password_reset',
 *     variables: { userName: 'John', resetLink: 'https://...' },
 *   });
 */

import { Resend } from 'resend';
import { EmailConfig } from './templates';

// Initialize Resend client lazily to avoid build-time errors when API key is not set
let resend = null;
function getResendClient() {
    if (!resend) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

/**
 * Get email template from database
 */
export async function getTemplateFromDb(templateType) {
    const { createServiceClient } = await import('../supabase-server');
    const supabase = await createServiceClient();

    const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('type', templateType)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.error(`Template "${templateType}" not found in database:`, error?.message);
        return null;
    }

    return data;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - HTML-escaped string
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    
    return str.replace(/[&<>"'/]/g, char => htmlEscapes[char]);
}

/**
 * Replace template variables with actual values
 *
 * Supports:
 * - Simple variables: {{userName}} → John (HTML-escaped)
 * - Raw/unescaped variables: {{{htmlContent}}} → <strong>bold</strong> (NOT escaped - use with caution)
 * - Conditional blocks: {{#courseTitle}}...{{/courseTitle}}
 * 
 * SECURITY: All {{variable}} values are HTML-escaped to prevent XSS.
 * Only use {{{variable}}} for trusted HTML content that you control.
 */
export function substituteTemplateVariables(html, variables) {
    let result = html;

    // Handle conditional blocks first: {{#variable}}content{{/variable}}
    const conditionalRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    result = result.replace(conditionalRegex, (match, varName, content) => {
        const value = variables[varName];
        // Only include content if variable exists and is truthy
        return value ? content : '';
    });

    // Handle unescaped/raw variables first: {{{variable}}} - for trusted HTML content only
    Object.entries(variables).forEach(([key, value]) => {
        const rawRegex = new RegExp(`\\{\\{\\{${key}\\}\\}\\}`, 'g');
        result = result.replace(rawRegex, value || '');
    });

    // Handle simple variables with HTML escaping: {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, escapeHtml(value));
    });

    return result;
}

/**
 * Send email with retry logic for rate limits
 */
async function sendEmailWithRetry(emailConfig, maxRetries = 3) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const client = getResendClient();
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const { data, error } = await client.emails.send(emailConfig);

            if (error) {
                if (error.statusCode === 429) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.log(`Rate limit hit, waiting ${waitTime}ms before retry...`);
                    await delay(waitTime);
                    continue;
                }
                return { error, data };
            }
            return { error: null, data };
        } catch (err) {
            if (attempt < maxRetries) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`Error sending email, retrying in ${waitTime}ms...`);
                await delay(waitTime);
            } else {
                return { error: err, data: null };
            }
        }
    }
    return { error: new Error('Max retries exceeded'), data: null };
}

/**
 * Send an email using a database template
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.templateType - Template type (e.g., 'password_reset', 'training_reminder')
 * @param {Object} options.variables - Variables to substitute in template
 * @param {string} [options.subject] - Override template subject (optional)
 * @param {string} [options.replyTo] - Override reply-to address (optional)
 *
 * @returns {Promise<Object>} Result with data or error
 */
export async function sendEmailFromTemplate({ to, templateType, variables, subject, replyTo }) {
    if (!to || !templateType) {
        return { error: new Error('Missing required parameters: to, templateType') };
    }

    // Get template from database
    const template = await getTemplateFromDb(templateType);

    if (!template) {
        return { error: new Error(`Template "${templateType}" not found in database`) };
    }

    // Substitute variables
    const htmlBody = substituteTemplateVariables(template.html, variables);
    const emailSubject = subject || template.subject;

    // Send email
    const result = await sendEmailWithRetry({
        from: EmailConfig.from,
        reply_to: replyTo || EmailConfig.replyTo,
        to: [to],
        subject: emailSubject,
        html: htmlBody,
    });

    return result;
}

/**
 * Send bulk emails with rate limiting
 *
 * @param {Object} options
 * @param {string[]} options.recipients - Array of email addresses
 * @param {string} options.templateType - Template type
 * @param {Object|Function} options.variables - Variables object or function that returns variables per recipient
 *
 * @returns {Promise<Object>} Result with sentCount, failedCount, total
 */
export async function sendBulkEmails({ recipients, templateType, variables }) {
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return { error: new Error('No valid recipients provided') };
    }

    // Verify template exists before sending
    const template = await getTemplateFromDb(templateType);
    if (!template) {
        return { error: new Error(`Template "${templateType}" not found in database`) };
    }

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
        const email = recipients[i];

        // Get variables for this recipient (supports per-user customization)
        const vars = typeof variables === 'function' ? variables(email, i) : variables;

        const result = await sendEmailFromTemplate({
            to: email,
            templateType,
            variables: vars,
        });

        if (result.error) {
            console.error(`Failed to send to ${email}:`, result.error);
            failedCount++;
        } else {
            sentCount++;
        }

        // Rate limiting delay between emails (Resend: 2 emails/second)
        if (i < recipients.length - 1) {
            await new Promise(resolve => setTimeout(resolve, EmailConfig.rateLimit.delayBetweenEmails));
        }
    }

    return {
        sentCount,
        failedCount,
        total: recipients.length,
    };
}

/**
 * Send bulk emails with custom per-recipient HTML (no DB template required)
 *
 * @param {Object} options
 * @param {Array<{email: string, name?: string}>} options.recipients
 * @param {string} options.subject
 * @param {Function} options.htmlFn - Called with each recipient, returns HTML string
 */
export async function sendBulkEmailsDirect({ recipients, subject, htmlFn }) {
    if (!recipients || recipients.length === 0) {
        return { error: new Error('No valid recipients provided') };
    }

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const html = htmlFn(recipient);

        const result = await sendEmailWithRetry({
            from: EmailConfig.from,
            reply_to: EmailConfig.replyTo,
            to: [recipient.email],
            subject,
            html,
        });

        if (result.error) {
            console.error(`Failed to send to ${recipient.email}:`, result.error);
            failedCount++;
        } else {
            sentCount++;
        }

        if (i < recipients.length - 1) {
            await new Promise(resolve => setTimeout(resolve, EmailConfig.rateLimit.delayBetweenEmails));
        }
    }

    return { sentCount, failedCount, total: recipients.length };
}

/**
 * Get all available template types from database
 */
export async function getAvailableTemplates() {
    const { createServiceClient } = await import('../supabase-server');
    const supabase = await createServiceClient();

    const { data, error } = await supabase
        .from('email_templates')
        .select('type, name, subject')
        .eq('is_active', true)
        .order('type');

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    return data || [];
}
