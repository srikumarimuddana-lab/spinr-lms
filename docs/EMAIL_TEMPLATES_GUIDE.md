# Supabase Email Templates Configuration Guide

This guide explains how to configure email templates in Supabase for authentication emails (password reset, email verification, etc.) and how to use the centralized email template system for application emails.

---

## Table of Contents

1. [Supabase Authentication Emails](#supabase-authentication-emails)
2. [Application Emails (Resend)](#application-emails-resend)
3. [Available Templates](#available-templates)
4. [Usage Examples](#usage-examples)

---

## Supabase Authentication Emails

Supabase handles authentication emails automatically. These include:

- **Password Reset** - Sent when user requests password reset
- **Email Verification** - Sent when user signs up
- **Magic Link** - Sent for passwordless login
- **Email Change** - Sent when user changes email address

### Configuration Steps

#### 1. Go to Supabase Dashboard

1. Navigate to your project at https://app.supabase.com
2. Go to **Authentication** → **Email Templates**

#### 2. Configure Site URL

Before customizing templates, set your site URL:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL (e.g., `https://spinrlms.com`)
3. Add redirect URLs:
   - `https://spinrlms.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

#### 3. Customize Email Templates

##### Password Reset Template

Click **Password Reset** and use this template:

```html
<h2>Reset Your Password</h2>

<p>Hi {{ .Email }},</p>

<p>We received a request to reset your password for your Spinr LMS account.</p>

<p>Click the button below to set a new password. This link will expire in 1 hour.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{ .ConfirmationURL }}" 
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
</p>
```

**Subject:** `Reset Your Password - Spinr LMS`

##### Email Verification Template

Click **Email Signup** and use this template:

```html
<h2>Verify Your Email</h2>

<p>Welcome to Spinr LMS!</p>

<p>Hi {{ .Email }},</p>

<p>Thanks for signing up! Please verify your email address to complete your registration.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{ .ConfirmationURL }}" 
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
</p>
```

**Subject:** `Verify Your Email - Spinr LMS`

##### Magic Link Template (if using passwordless login)

Click **Magic Link** and use this template:

```html
<h2>Magic Link Login</h2>

<p>Hi {{ .Email }},</p>

<p>Click the button below to log in to your Spinr LMS account.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{ .ConfirmationURL }}" 
         style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Sign In
      </a>
    </td>
  </tr>
</table>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request this login, you can safely ignore this email.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  This is an automated message from Spinr LMS.<br>
  &copy; 2026 Spinr LMS. All rights reserved.
</p>
```

**Subject:** `Your Magic Link - Spinr LMS`

---

## Application Emails (Resend)

For application-sent emails (reminders, invitations, promotions), we use [Resend](https://resend.com) with a centralized template system.

### Setup

1. Get your API key from https://resend.com/api-keys
2. Add to your `.env.local`:
   ```
   RESEND_API_KEY=re_your_api_key
   EMAIL_FROM_ADDRESS=Spinr Training <noreply@training.spinr.ca>
   EMAIL_REPLY_TO=support@spinr.ca
   ```

### Verified Domain (Optional for Production)

For production, verify your domain in Resend:

1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `spinr.ca`)
3. Add DNS records to your domain registrar
4. Update `EMAIL_FROM_ADDRESS` to use your verified domain

---

## Available Templates

All templates are located in `src/lib/email/templates.js`.

### Import

```javascript
import { 
  passwordResetTemplate,
  emailVerificationTemplate,
  trainingReminderTemplate,
  courseInvitationTemplate,
  promotionalTemplate,
  accountNotificationTemplate,
  EmailConfig 
} from '@/lib/email';
```

### Template Parameters

#### `passwordResetTemplate({ userName, resetLink, expiryHours })`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userName | string | No | User's display name |
| resetLink | string | Yes | Password reset URL from Supabase |
| expiryHours | number | No | Link expiry in hours (default: 1) |

#### `emailVerificationTemplate({ userName, verificationLink, confirmationCode })`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userName | string | No | User's display name |
| verificationLink | string | No | Verification URL |
| confirmationCode | string | No | Code for email verification |

#### `trainingReminderTemplate({ userName, courseTitle, customMessage, dashboardLink })`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userName | string | No | User's display name |
| courseTitle | string | No | Course name |
| customMessage | string | No | Custom reminder message |
| dashboardLink | string | No | Link to training dashboard |

#### `courseInvitationTemplate({ userName, courseTitle, courseDescription, customMessage, signupLink })`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userName | string | No | User's display name |
| courseTitle | string | No | Course name |
| courseDescription | string | No | Course description |
| customMessage | string | No | Custom invitation message |
| signupLink | string | No | Link to signup page |

#### `promotionalTemplate({ subject, preheader, content, ctaButton, footerText })`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subject | string | Yes | Email subject line |
| preheader | string | No | Preview text |
| content | string | Yes | HTML content |
| ctaButton | object | No | CTA button config |
| footerText | string | No | Footer text |

---

## Usage Examples

### Send Password Reset Email (Supabase)

```javascript
// Handled automatically by Supabase
// Just call resetPasswordForEmail with redirect URL
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/callback`,
});
```

### Send Training Reminder

```javascript
const response = await fetch('/api/emails/reminders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userIds: ['user-1', 'user-2'],
    courseId: 'course-123',
    customMessage: 'Your training is due this Friday!',
  }),
});
```

### Send Course Invitation

```javascript
const response = await fetch('/api/emails/invitations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emails: 'user1@example.com\nuser2@example.com',
    courseId: 'course-123',
    customMessage: 'You\'ve been invited to join this course!',
  }),
});
```

### Send Promotional Email

```javascript
const response = await fetch('/api/emails/promotional', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'New Course Available!',
    body: '<p>Check out our latest training module...</p>',
    userIds: ['user-1', 'user-2'],
    ctaLink: 'https://spinrlms.com/courses/new',
    ctaText: 'View Course',
  }),
});
```

---

## Rate Limits

### Resend Free Tier

- **100 emails per day**
- **2 emails per second**
- Automatic rate limiting is built into the API routes

### Supabase (Provider Dependent)

- Depends on your email provider (SendGrid, etc.)
- Check your Supabase project settings

---

## Troubleshooting

### Emails Not Sending

1. Check Resend API key in environment variables
2. Verify domain (if using custom from address)
3. Check Resend dashboard for errors

### Password Reset Not Working

1. Verify Site URL in Supabase dashboard
2. Add `/auth/callback` to redirect URLs
3. Check email template uses `{{ .ConfirmationURL }}`

### Rate Limit Errors

- Built-in retry logic handles temporary rate limits
- Consider upgrading Resend plan for higher limits

---

## Environment Variables

Add these to your `.env.local`:

```bash
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=Spinr Training <noreply@training.spinr.ca>
EMAIL_REPLY_TO=support@spinr.ca

# Site URL
NEXT_PUBLIC_SITE_URL=https://spinrlms.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```
