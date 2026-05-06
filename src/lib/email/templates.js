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
// TEMPLATE: Rider Promotional Email (Coupon/Promo Codes)
// ============================================================================
export function riderPromotionalTemplate({ riderName, couponCode, discountPercent, expiryDate, maxRides, appUrl, logoUrl, unsubscribeUrl }) {
    const safeRiderName = escapeHtml(riderName) || 'there';
    const safeCouponCode = escapeHtml(couponCode);
    const safeDiscountPercent = escapeHtml(String(discountPercent));
    const safeExpiryDate = expiryDate ? escapeHtml(expiryDate) : null;
    const safeMaxRides = maxRides ? escapeHtml(String(maxRides)) : null;
    const safeAppUrl = escapeHtml(appUrl || '#');
    const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : null;
    const safeUnsubscribeUrl = unsubscribeUrl ? escapeHtml(unsubscribeUrl) : safeAppUrl;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've got a promo from Spinr!</title>
  <style>
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes softPulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.82; }
    }
    body { margin:0; padding:0; background:#f0f0f0; }
    .fade { animation: fadeIn 0.6s ease-out both; }
    .btn-main:hover { opacity: 0.88; }
    .coupon-pill { animation: softPulse 3s ease-in-out infinite; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Hidden preheader -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f0f0f0;">
    ${safeRiderName}, you've got ${safeDiscountPercent}% off your rides with code ${safeCouponCode}
  </div>

  <table role="presentation" width="100%" style="border-collapse:collapse;background:#f0f0f0;">
    <tr>
      <td align="center" style="padding:36px 16px 48px;">
        <table role="presentation" width="100%" style="max-width:580px;border-collapse:collapse;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- ── HEADER: Logo ── -->
          <tr>
            <td style="padding:32px 40px 0;">
              ${safeLogoUrl
                ? `<img src="${safeLogoUrl}" alt="Spinr" width="120" height="49"
                        style="display:block;width:120px;height:auto;border:0;" />`
                : `<p style="margin:0;font-size:26px;font-weight:900;color:#dc2626;letter-spacing:-0.5px;font-family:Arial,sans-serif;">spinr</p>`
              }
            </td>
          </tr>

          <!-- ── HERO TEXT ── -->
          <tr>
            <td class="fade" style="padding:28px 40px 8px;">
              <h1 style="margin:0 0 16px;color:#111827;font-size:36px;font-weight:800;line-height:1.15;letter-spacing:-0.8px;">
                ${safeDiscountPercent}% off your${safeMaxRides ? ` first ${safeMaxRides}` : ''} rides
              </h1>
              <p style="margin:0 0 12px;color:#374151;font-size:17px;line-height:1.65;">
                Now's a great time to ride with Spinr, ${safeRiderName}. From early morning commutes to late night plans — get wherever you're going for less.
              </p>
              ${safeExpiryDate || safeMaxRides ? `
              <p style="margin:0 0 0;color:#6b7280;font-size:15px;line-height:1.6;">
                Use your discount${safeExpiryDate ? ` by <strong style="color:#111827;">${safeExpiryDate}</strong>` : ''}.${safeMaxRides ? ` Valid for up to ${safeMaxRides} ride(s).` : ''} Not valid on all ride types.
              </p>` : ''}
            </td>
          </tr>

          <!-- ── CTA BUTTON ── -->
          <tr>
            <td style="padding:28px 40px 0;text-align:center;">
              <a href="${safeAppUrl}" class="btn-main"
                 style="display:inline-block;background:#16a34a;color:#ffffff;padding:16px 48px;text-decoration:none;border-radius:50px;font-weight:700;font-size:17px;letter-spacing:0.2px;transition:opacity 0.2s;">
                Claim ${safeDiscountPercent}% off
              </a>
            </td>
          </tr>

          <!-- ── COUPON CODE PILL ── -->
          <tr>
            <td style="padding:20px 40px 0;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:13px;">
                Or enter code at checkout:&nbsp;
                <span class="coupon-pill"
                      style="display:inline-block;background:#f0fdf4;color:#15803d;font-family:'Courier New',monospace;font-weight:800;font-size:15px;letter-spacing:4px;padding:6px 16px;border-radius:6px;border:1.5px solid #bbf7d0;">
                  ${safeCouponCode}
                </span>
              </p>
            </td>
          </tr>

          <!-- ── HERO IMAGE ── -->
          <tr>
            <td style="padding:32px 40px 0;line-height:0;">
              <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=220&fit=crop&q=80"
                   alt="Ride with Spinr"
                   width="500"
                   style="display:block;width:100%;height:auto;border-radius:10px;max-width:500px;"
              />
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr>
            <td style="padding:36px 40px 0;">
              <div style="height:1px;background:#e5e7eb;"></div>
            </td>
          </tr>

          <!-- ── MORE REASONS TO RIDE ── -->
          <tr>
            <td style="padding:32px 40px 8px;">
              <h2 style="margin:0 0 24px;color:#111827;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                More reasons to ride
              </h2>

              <!-- Reason 1 -->
              <table role="presentation" width="100%" style="margin:0 0 20px;">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:40px;height:40px;background:#f0fdf4;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">&#x1F6E1;&#xFE0F;</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;color:#111827;font-size:15px;font-weight:700;">Safety first, always</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Every Spinr driver is background-checked and trained. Share your trip live with anyone you trust.</p>
                  </td>
                </tr>
              </table>

              <!-- Reason 2 -->
              <table role="presentation" width="100%" style="margin:0 0 20px;">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:40px;height:40px;background:#f0fdf4;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">&#x1F4B3;</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;color:#111827;font-size:15px;font-weight:700;">Know your price before you go</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Upfront pricing, no surprises. Your ${safeDiscountPercent}% off is applied automatically — just book and go.</p>
                  </td>
                </tr>
              </table>

              <!-- Reason 3 -->
              <table role="presentation" width="100%">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:40px;height:40px;background:#f0fdf4;border-radius:10px;text-align:center;line-height:40px;font-size:20px;">&#x23F0;</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;color:#111827;font-size:15px;font-weight:700;">Available whenever you need us</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Early morning or late night — Spinr is ready. Request a ride in seconds, any time of day.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── SECOND CTA ── -->
          <tr>
            <td style="padding:28px 40px 36px;text-align:center;">
              <a href="${safeAppUrl}"
                 style="display:inline-block;background:#111827;color:#ffffff;padding:14px 40px;text-decoration:none;border-radius:50px;font-weight:700;font-size:15px;">
                Get the Spinr app &rarr;
              </a>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;">
              <p style="margin:0 0 6px;color:#dc2626;font-size:12px;font-weight:700;text-align:center;letter-spacing:0.3px;">
                * Terms &amp; Conditions Apply
              </p>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:11px;line-height:1.75;text-align:center;">
                This promo is only valid for riders who received this email directly from Spinr.
                ${safeMaxRides ? `Valid for up to ${safeMaxRides} ride(s). ` : ''}
                ${safeExpiryDate ? `Expires ${safeExpiryDate}. ` : ''}
                Discount does not apply to surcharges, fees, tolls, tips or taxes.
                Cannot be combined with other offers. Code&nbsp;<strong>${safeCouponCode}</strong>&nbsp;is non-transferable. Terms subject to change.
              </p>
              <p style="margin:12px 0 0;text-align:center;">
                <a href="${safeAppUrl}" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 8px;">Help</a>
                <span style="color:#d1d5db;font-size:12px;">|</span>
                <a href="${safeAppUrl}" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 8px;">Terms</a>
                <span style="color:#d1d5db;font-size:12px;">|</span>
                <a href="${safeUnsubscribeUrl}" style="color:#6b7280;text-decoration:none;font-size:12px;margin:0 8px;">Unsubscribe</a>
              </p>
              <p style="margin:10px 0 0;color:#d1d5db;font-size:11px;text-align:center;">
                &copy; ${year} Spinr. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
