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
export function riderPromotionalTemplate({ riderName, couponCode, discountPercent, expiryDate, maxRides, appUrl }) {
    const safeRiderName = escapeHtml(riderName) || 'there';
    const safeCouponCode = escapeHtml(couponCode);
    const safeDiscountPercent = escapeHtml(String(discountPercent));
    const safeExpiryDate = expiryDate ? escapeHtml(expiryDate) : null;
    const safeMaxRides = maxRides ? escapeHtml(String(maxRides)) : null;
    const safeAppUrl = escapeHtml(appUrl || '#');
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've got a promo from Spinr!</title>
  <style>
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.55); }
      50%      { box-shadow: 0 0 0 14px rgba(34,197,94,0); }
    }
    @keyframes pulseRed {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.55); }
      50%      { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
    }
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      0%   { background-position: -300px 0; }
      100% { background-position: 300px 0; }
    }
    @keyframes wiggle {
      0%, 100% { transform: rotate(-2deg); }
      50%      { transform: rotate(2deg); }
    }
    .ribbon       { animation: wiggle 3s ease-in-out infinite; }
    .coupon-box   { animation: pulse 2.4s ease-in-out infinite; }
    .cta-red      { animation: pulseRed 2.2s ease-in-out infinite; }
    .hero-title   { animation: fadeInDown 0.7s ease-out both; }
    .hero-sub     { animation: fadeInDown 0.7s 0.15s ease-out both; }
    .cta-btn      { animation: fadeInDown 0.7s 0.3s ease-out both; }
    .step         { animation: fadeInUp 0.6s ease-out both; }
    .step-1       { animation-delay: 0.05s; }
    .step-2       { animation-delay: 0.20s; }
    .step-3       { animation-delay: 0.35s; }
    .shimmer-bg {
      background: linear-gradient(90deg,#dc2626 0%,#ef4444 25%,#fca5a5 50%,#ef4444 75%,#dc2626 100%);
      background-size: 600px 100%;
      animation: shimmer 3s linear infinite;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <!-- Preheader (hidden) -->
  <div style="display:none;font-size:1px;color:#f5f5f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${safeRiderName}, you've got ${safeDiscountPercent}% off your next rides with code ${safeCouponCode}
  </div>

  <table role="presentation" width="100%" style="border-collapse:collapse;background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" style="max-width:600px;border-collapse:collapse;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.12);">

          <!-- ════════ RED RIBBON BANNER ════════ -->
          <tr>
            <td class="shimmer-bg" style="padding:14px 24px;text-align:center;">
              <p class="ribbon" style="margin:0;color:#ffffff;font-size:13px;font-weight:900;letter-spacing:4px;text-transform:uppercase;display:inline-block;">
                &#x1F381; &nbsp; Limited Time Offer &nbsp; &#x1F381;
              </p>
            </td>
          </tr>

          <!-- ════════ BLACK HERO ════════ -->
          <tr>
            <td style="background:#000000;padding:40px 40px 32px;position:relative;">
              <!-- Logo + tagline row -->
              <table role="presentation" width="100%" style="margin:0 0 24px;">
                <tr>
                  <td>
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:4px;text-transform:uppercase;">
                      <span style="color:#22c55e;">&#x25CF;</span>&nbsp; SPINR
                    </p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:#dc2626;color:#fff;padding:5px 12px;border-radius:50px;font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">
                      Exclusive
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Big headline -->
              <h1 class="hero-title" style="margin:0 0 14px;color:#ffffff;font-size:34px;font-weight:900;line-height:1.1;letter-spacing:-0.5px;">
                Hey ${safeRiderName}, you've got
              </h1>
              <h2 class="hero-title" style="margin:0 0 18px;color:#22c55e;font-size:56px;font-weight:900;line-height:1;letter-spacing:-2px;">
                ${safeDiscountPercent}% OFF
              </h2>
              <p class="hero-sub" style="margin:0 0 26px;color:#d1d5db;font-size:16px;line-height:1.6;">
                Your next${safeMaxRides ? ` <strong style="color:#fff;">${safeMaxRides} rides</strong>` : ' ride'} on Spinr — courtesy of us.
                ${safeExpiryDate ? `Hurry, this deal expires <strong style="color:#fbbf24;">${safeExpiryDate}</strong>.` : ''}
              </p>

              <!-- Dual CTAs -->
              <table role="presentation" class="cta-btn" style="margin:0;">
                <tr>
                  <td style="padding-right:10px;">
                    <a href="${safeAppUrl}"
                       style="display:inline-block;background:#22c55e;color:#000000;padding:14px 28px;text-decoration:none;border-radius:50px;font-weight:900;font-size:14px;letter-spacing:0.5px;text-transform:uppercase;">
                      &#x1F697; &nbsp;Book a Ride
                    </a>
                  </td>
                  <td>
                    <a href="${safeAppUrl}"
                       style="display:inline-block;background:transparent;color:#ffffff;padding:13px 24px;text-decoration:none;border-radius:50px;font-weight:700;font-size:13px;letter-spacing:0.5px;border:2px solid #ffffff;">
                      Learn More
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ COUPON CODE — GREEN ON BLACK ════════ -->
          <tr>
            <td style="background:#000000;padding:8px 40px 40px;">
              <table role="presentation" width="100%" class="coupon-box"
                     style="border:3px dashed #22c55e;border-radius:18px;background:linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%);">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="margin:0 0 4px;color:#86efac;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:4px;">
                      &#x2702; Your Promo Code &#x2702;
                    </p>
                    <p style="margin:10px 0 6px;color:#ffffff;font-size:38px;font-weight:900;letter-spacing:12px;font-family:'Courier New',Courier,monospace;text-shadow:0 2px 0 rgba(0,0,0,0.4);">
                      ${safeCouponCode}
                    </p>
                    <table role="presentation" align="center" style="margin:6px auto 0;">
                      <tr>
                        <td style="background:#22c55e;color:#000;font-weight:900;font-size:11px;padding:5px 14px;border-radius:50px;letter-spacing:1.5px;text-transform:uppercase;">
                          ${safeDiscountPercent}% Off Applied
                        </td>
                      </tr>
                    </table>
                    <p style="margin:14px 0 0;color:#a7f3d0;font-size:12px;line-height:1.5;">
                      Tap to copy &amp; paste at checkout, or it'll be auto-applied to your account
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${safeExpiryDate ? `
          <!-- ════════ RED EXPIRY STRIP ════════ -->
          <tr>
            <td style="background:#dc2626;padding:14px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">
                &#x23F0; &nbsp; Expires ${safeExpiryDate} &nbsp; — &nbsp; Don't miss out!
              </p>
            </td>
          </tr>` : ''}

          <!-- ════════ WHITE: HOW IT WORKS ════════ -->
          <tr>
            <td style="background:#ffffff;padding:44px 40px 36px;">
              <p style="margin:0 0 6px;color:#dc2626;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;text-align:center;">
                ⎯⎯⎯ &nbsp; Easy as 1-2-3 &nbsp; ⎯⎯⎯
              </p>
              <h3 style="margin:0 0 28px;color:#111827;font-size:26px;font-weight:900;text-align:center;letter-spacing:-0.5px;">
                How to redeem your offer
              </h3>

              <!-- Step 1 -->
              <table role="presentation" width="100%" class="step step-1" style="margin:0 0 16px;">
                <tr>
                  <td width="56" style="vertical-align:top;">
                    <div style="width:44px;height:44px;background:#dc2626;color:#fff;border-radius:50%;text-align:center;line-height:44px;font-weight:900;font-size:18px;font-family:Arial,sans-serif;">1</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 4px;color:#111827;font-size:16px;font-weight:800;">Open the Spinr app</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.55;">Sign in with the email this promo was sent to.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table role="presentation" width="100%" class="step step-2" style="margin:0 0 16px;">
                <tr>
                  <td width="56" style="vertical-align:top;">
                    <div style="width:44px;height:44px;background:#dc2626;color:#fff;border-radius:50%;text-align:center;line-height:44px;font-weight:900;font-size:18px;font-family:Arial,sans-serif;">2</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 4px;color:#111827;font-size:16px;font-weight:800;">Enter your code</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.55;">Tap <em>Promotions</em> and add <strong style="color:#16a34a;font-family:monospace;">${safeCouponCode}</strong>.</p>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table role="presentation" width="100%" class="step step-3">
                <tr>
                  <td width="56" style="vertical-align:top;">
                    <div style="width:44px;height:44px;background:#16a34a;color:#fff;border-radius:50%;text-align:center;line-height:44px;font-weight:900;font-size:18px;font-family:Arial,sans-serif;">3</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 4px;color:#111827;font-size:16px;font-weight:800;">Ride &amp; save ${safeDiscountPercent}%</p>
                    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.55;">Discount is applied automatically at checkout. Enjoy the ride!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ GREEN STATS BAR ════════ -->
          <tr>
            <td style="background:linear-gradient(90deg,#16a34a 0%,#22c55e 50%,#16a34a 100%);padding:22px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td width="33%" align="center" style="border-right:1px solid rgba(255,255,255,0.25);padding:0 8px;">
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;line-height:1;">10K+</p>
                    <p style="margin:4px 0 0;color:#dcfce7;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Riders</p>
                  </td>
                  <td width="33%" align="center" style="border-right:1px solid rgba(255,255,255,0.25);padding:0 8px;">
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;line-height:1;">4.9 &#x2605;</p>
                    <p style="margin:4px 0 0;color:#dcfce7;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Avg Rating</p>
                  </td>
                  <td width="34%" align="center" style="padding:0 8px;">
                    <p style="margin:0;color:#ffffff;font-size:22px;font-weight:900;line-height:1;">24/7</p>
                    <p style="margin:4px 0 0;color:#dcfce7;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Available</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ BLACK FEATURES SECTION ════════ -->
          <tr>
            <td style="background:#000000;padding:40px 40px 36px;">
              <h3 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:900;text-align:center;letter-spacing:-0.5px;">
                Why riders <span style="color:#dc2626;">&#x2764;</span> Spinr
              </h3>
              <p style="margin:0 0 28px;color:#9ca3af;font-size:13px;line-height:1.6;text-align:center;">
                Built to move with you, every day.
              </p>

              <!-- Feature 1 -->
              <table role="presentation" width="100%" style="margin:0 0 18px;">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:42px;height:42px;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:12px;text-align:center;line-height:42px;font-size:20px;">&#x1F697;</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;color:#ffffff;font-size:15px;font-weight:800;">Verified, vetted drivers</p>
                    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">Background-checked and trained — your safety is our priority.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature 2 -->
              <table role="presentation" width="100%" style="margin:0 0 18px;">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:42px;height:42px;background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:12px;text-align:center;line-height:42px;font-size:20px;">&#x1F4CD;</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;color:#ffffff;font-size:15px;font-weight:800;">Live trip tracking</p>
                    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">Watch your driver arrive in real time and share trip details with loved ones.</p>
                  </td>
                </tr>
              </table>

              <!-- Feature 3 -->
              <table role="presentation" width="100%">
                <tr>
                  <td width="48" style="vertical-align:top;padding-top:2px;">
                    <div style="width:42px;height:42px;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:12px;text-align:center;line-height:42px;font-size:20px;">&#x1F4B0;</div>
                  </td>
                  <td style="padding-left:14px;">
                    <p style="margin:0 0 3px;color:#ffffff;font-size:15px;font-weight:800;">Upfront, transparent pricing</p>
                    <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">No surge surprises. Know your fare before you book — and save more with <strong style="color:#22c55e;font-family:monospace;">${safeCouponCode}</strong>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ════════ RED FINAL CTA STRIP ════════ -->
          <tr>
            <td style="background:linear-gradient(135deg,#991b1b 0%,#dc2626 50%,#ef4444 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#fecaca;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">
                ⎯⎯ &nbsp; Don't wait &nbsp; ⎯⎯
              </p>
              <h3 style="margin:0 0 16px;color:#ffffff;font-size:24px;font-weight:900;letter-spacing:-0.3px;">
                Your ${safeDiscountPercent}% off is waiting
              </h3>
              <p style="margin:0 0 22px;color:#fee2e2;font-size:14px;line-height:1.6;">
                Book your next ride now — savings auto-applied at checkout.
              </p>
              <a href="${safeAppUrl}" class="cta-red"
                 style="display:inline-block;background:#ffffff;color:#dc2626;padding:15px 38px;text-decoration:none;border-radius:50px;font-weight:900;font-size:15px;letter-spacing:1px;text-transform:uppercase;">
                Book Now &rarr;
              </a>
            </td>
          </tr>

          <!-- ════════ WHITE FOOTER / DISCLAIMER ════════ -->
          <tr>
            <td style="background:#ffffff;padding:28px 40px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0 0 10px;color:#374151;font-size:13px;font-weight:700;text-align:center;">
                Questions? We're here to help.
              </p>
              <p style="margin:0 0 16px;text-align:center;">
                <a href="${safeAppUrl}" style="color:#dc2626;text-decoration:none;font-size:13px;font-weight:600;margin:0 10px;">Help Centre</a>
                <span style="color:#d1d5db;">|</span>
                <a href="${safeAppUrl}" style="color:#16a34a;text-decoration:none;font-size:13px;font-weight:600;margin:0 10px;">Terms</a>
                <span style="color:#d1d5db;">|</span>
                <a href="${safeAppUrl}" style="color:#111827;text-decoration:none;font-size:13px;font-weight:600;margin:0 10px;">Privacy</a>
              </p>
              <p style="margin:0 0 10px;color:#9ca3af;font-size:10px;line-height:1.7;text-align:center;">
                This promo is only valid for riders who received this email directly from Spinr.
                ${safeMaxRides ? `Valid for up to ${safeMaxRides} ride(s). ` : ''}
                ${safeExpiryDate ? `Expires ${safeExpiryDate}. ` : ''}
                Promo doesn't apply to surcharges, fees, tolls, tips or taxes.
                Cannot be combined with other offers. Code <strong style="color:#6b7280;">${safeCouponCode}</strong> is non-transferable. Terms subject to change.
              </p>
              <p style="margin:14px 0 0;color:#9ca3af;font-size:11px;text-align:center;">
                &copy; ${year} Spinr. All rights reserved. &nbsp;|&nbsp; <a href="${safeAppUrl}" style="color:#16a34a;text-decoration:none;">spinr.ca</a>
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
