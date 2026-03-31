/**
 * Email Templates for Spinr LMS
 * Centralized template system for all transactional and promotional emails
 * 
 * SECURITY NOTE: All user-provided values must be HTML-escaped before injection.
 * Use escapeHtml() for any dynamic content that could contain user input.
 */

/**
 * Escape HTML special characters to prevent XSS
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

// Base email layout wrapper
export function createEmailLayout({
    title,
    content,
    ctaButton,
    footerText,
    branding = true,
}) {
    // Escape user-provided values
    const safeTitle = escapeHtml(title);
    const safeFooterText = footerText ? escapeHtml(footerText) : 'This is an automated message from Spinr LMS. Please do not reply to this email.';
    const safeCtaHref = ctaButton?.href ? escapeHtml(ctaButton.href) : '';
    const safeCtaText = ctaButton?.text ? escapeHtml(ctaButton.text) : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    ${branding ? `
                    <tr>
                        <td style="background-color: #2563eb; padding: 24px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${safeTitle}</h1>
                        </td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 40px 32px;">
                            ${content}
                            ${ctaButton ? `
                            <table role="presentation" style="margin: 24px 0; width: 100%;">
                                <tr>
                                    <td align="center">
                                        <a href="${safeCtaHref}"
                                           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                                            ${safeCtaText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                                ${safeFooterText}
                            </p>
                            <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                &copy; ${new Date().getFullYear()} Spinr LMS. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

// Content helpers
export function createContentBlock({ heading, paragraphs, items }) {
    const safeHeading = escapeHtml(heading);
    const headingHtml = heading ? `<h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px; font-weight: 600;">${safeHeading}</h2>` : '';
    // Note: paragraphs may contain intentional HTML markup (like <strong>), so they're not escaped here
    // The individual template functions should escape user data before creating paragraphs
    const paragraphsHtml = paragraphs?.map(p => `<p style="margin: 0 0 12px 0; color: #374151; font-size: 16px; line-height: 1.6;">${p}</p>`).join('') || '';
    const itemsHtml = items ? `
        <ul style="margin: 16px 0; padding-left: 24px; color: #374151; font-size: 16px; line-height: 1.8;">
            ${items.map(item => `<li>${item}</li>`).join('')}
        </ul>
    ` : '';

    return `${headingHtml}${paragraphsHtml}${itemsHtml}`;
}

// ============================================================================
// TEMPLATE: Password Reset
// ============================================================================
export function passwordResetTemplate({ userName, resetLink, expiryHours = 1 }) {
    const safeUserName = escapeHtml(userName) || 'there';
    const safeResetLink = escapeHtml(resetLink);
    
    const content = createContentBlock({
        heading: 'Reset Your Password',
        paragraphs: [
            `Hi ${safeUserName},`,
            `We received a request to reset your password for your Spinr LMS account.`,
            `Click the button below to set a new password. This link will expire in ${expiryHours} hour(s).`,
            `If you didn't request this password reset, you can safely ignore this email.`,
        ],
    });

    return createEmailLayout({
        title: 'Password Reset',
        content,
        ctaButton: {
            href: resetLink, // Will be escaped in createEmailLayout
            text: 'Reset Password',
        },
        footerText: 'If you\'re having trouble clicking the button, copy and paste this link into your browser: ' + safeResetLink,
    });
}

// ============================================================================
// TEMPLATE: Email Verification
// ============================================================================
export function emailVerificationTemplate({ userName, verificationLink, confirmationCode }) {
    const safeUserName = escapeHtml(userName) || 'there';
    const safeConfirmationCode = escapeHtml(confirmationCode);
    
    const content = createContentBlock({
        heading: 'Verify Your Email',
        paragraphs: [
            `Hi ${safeUserName},`,
            `Welcome to Spinr LMS! Please verify your email address to complete your registration.`,
            confirmationCode ? `Your confirmation code is: <strong style="font-size: 18px; letter-spacing: 4px;">${safeConfirmationCode}</strong>` : 'Click the button below to verify your email address.',
        ],
    });

    return createEmailLayout({
        title: 'Email Verification',
        content,
        ctaButton: verificationLink ? {
            href: verificationLink,
            text: 'Verify Email',
        } : null,
        footerText: 'If you didn\'t create an account, you can safely ignore this email.',
    });
}

// ============================================================================
// TEMPLATE: Training Reminder
// ============================================================================
export function trainingReminderTemplate({ userName, courseTitle, customMessage, dashboardLink }) {
    const safeUserName = escapeHtml(userName) || 'there';
    const safeCourseTitle = escapeHtml(courseTitle);
    const safeCustomMessage = escapeHtml(customMessage);
    
    const content = createContentBlock({
        heading: 'Training Reminder',
        paragraphs: [
            `Hi ${safeUserName},`,
            safeCustomMessage || 'This is a friendly reminder to complete your pending training.',
            courseTitle ? `Course: <strong>${safeCourseTitle}</strong>` : '',
        ],
    });

    return createEmailLayout({
        title: 'Training Reminder',
        content,
        ctaButton: {
            href: dashboardLink || '/dashboard',
            text: 'Go to Training Dashboard',
        },
    });
}

// ============================================================================
// TEMPLATE: Course Invitation
// ============================================================================
export function courseInvitationTemplate({ userName, courseTitle, courseDescription, customMessage, signupLink }) {
    const safeUserName = escapeHtml(userName) || 'there';
    const safeCourseTitle = escapeHtml(courseTitle);
    const safeCourseDescription = escapeHtml(courseDescription);
    const safeCustomMessage = escapeHtml(customMessage);
    
    const content = createContentBlock({
        heading: 'Welcome to Spinr LMS!',
        paragraphs: [
            `Hi ${safeUserName},`,
            safeCustomMessage || 'We invite you to start your training with us.',
        ],
        items: courseTitle ? [`Course: <strong>${safeCourseTitle}</strong>`] : [],
    });

    const descriptionHtml = courseDescription ? `
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${safeCourseDescription}</p>
        </div>
    ` : '';

    return createEmailLayout({
        title: 'Course Invitation',
        content: `${content}${descriptionHtml}`,
        ctaButton: {
            href: signupLink || '/signup',
            text: 'Sign Up Now',
        },
    });
}

// ============================================================================
// TEMPLATE: Promotional Email
// ============================================================================
export function promotionalTemplate({ subject, preheader, content: contentHtml, ctaButton, footerText }) {
    return createEmailLayout({
        title: subject,
        content: contentHtml,
        ctaButton,
        footerText,
        branding: true,
    });
}

// ============================================================================
// TEMPLATE: Account Notification
// ============================================================================
export function accountNotificationTemplate({ userName, subject, message, actionRequired }) {
    const safeUserName = escapeHtml(userName) || 'there';
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);
    
    const content = createContentBlock({
        heading: safeSubject,
        paragraphs: [
            `Hi ${safeUserName},`,
            safeMessage,
        ],
    });

    return createEmailLayout({
        title: subject, // Will be escaped in createEmailLayout
        content,
        ctaButton: actionRequired ? {
            href: actionRequired.link,
            text: actionRequired.text,
        } : null,
    });
}

// ============================================================================
// EMAIL CONFIGURATION HELPERS
// ============================================================================

export const EmailConfig = {
    // Default sender
    from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <noreply@training.spinr.ca>',

    // Reply-to (optional)
    replyTo: process.env.EMAIL_REPLY_TO || 'support@spinr.ca',

    // Base URL for links
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://spinrlms.com',

    // Rate limiting (Resend free tier: 2 emails/second, 100/day)
    rateLimit: {
        emailsPerSecond: 2,
        dailyLimit: 100,
        delayBetweenEmails: 550, // ms
    },
};

// Helper to generate tracking params
export function addTrackingParams(url, params = {}) {
    const urlObj = new URL(url, EmailConfig.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
    });
    return urlObj.toString();
}
