# Email Template System - Usage Guide

## Overview

The Spinr LMS email system uses **database-stored templates** with variable substitution. Admins can edit templates in the UI at `/admin/email-templates`, and send emails using the new Send Email interface at `/admin/send-email`.

---

## Quick Start (Admin UI)

### Send an Email Using the UI

1. Go to `/admin/send-email`
2. **Select a template** from the dropdown
3. **Fill in the variables** (userName, courseTitle, etc.)
4. **Select recipients** - choose drivers from the list and/or add additional emails
5. **Preview** the email to see how it looks
6. Click **Send Email**

### Available Templates

| Template | Use Case | Variables |
|----------|----------|-----------|
| Password Reset | Send password reset link | userName, resetLink |
| Email Verification | Verify user email | userName, verificationLink, confirmationCode |
| Training Reminder | Remind about pending training | userName, courseTitle, dashboardLink |
| Course Invitation | Invite users to a course | userName, courseTitle, courseDescription, signupLink |
| Promotional | Marketing emails | subject, preheader, content, ctaButton |
| Account Notification | Account updates | userName, subject, message |

### Send Bulk Emails

```javascript
import { sendBulkEmails } from '@/lib/email';

// Send to multiple recipients
const result = await sendBulkEmails({
  recipients: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  templateType: 'training_reminder',
  variables: {
    userName: 'Driver',  // Same for all
    courseTitle: 'Safety Training',
    dashboardLink: 'https://spinrlms.com/dashboard',
  },
});

console.log(`Sent: ${result.sentCount}, Failed: ${result.failedCount}`);
```

### Send with Per-User Customization

```javascript
import { sendBulkEmails } from '@/lib/email';

const users = [
  { email: 'john@example.com', name: 'John Doe' },
  { email: 'jane@example.com', name: 'Jane Smith' },
];

const result = await sendBulkEmails({
  recipients: users.map(u => u.email),
  templateType: 'course_invitation',
  variables: (email, index) => {
    const user = users[index];
    return {
      userName: user.name,
      courseTitle: 'Advanced Driving',
      courseDescription: 'Learn defensive driving techniques.',
      signupLink: 'https://spinrlms.com/signup',
    };
  },
});
```

---

## Available Template Types

| Template Type | Description | Variables |
|---------------|-------------|-----------|
| `password_reset` | Password reset emails | `{{userName}}`, `{{resetLink}}` |
| `email_verification` | Email verification | `{{userName}}`, `{{verificationLink}}`, `{{confirmationCode}}` |
| `training_reminder` | Training completion reminders | `{{userName}}`, `{{courseTitle}}`, `{{dashboardLink}}` |
| `course_invitation` | Course invitations | `{{userName}}`, `{{courseTitle}}`, `{{courseDescription}}`, `{{signupLink}}` |
| `promotional` | Marketing/promotional emails | `{{subject}}`, `{{preheader}}`, `{{content}}`, `{{ctaButton}}` |
| `account_notification` | Account notifications | `{{userName}}`, `{{subject}}`, `{{message}}` |

---

## Template Syntax

### Simple Variables

```html
<p>Hi {{userName}},</p>
<p>Your course: {{courseTitle}}</p>
```

### Conditional Blocks

Show content only if a variable exists:

```html
{{#courseTitle}}
<p><strong>Course:</strong> {{courseTitle}}</p>
{{/courseTitle}}
```

If `courseTitle` is empty or undefined, the entire block is omitted.

---

## API Endpoints

### POST /api/emails/reminders

Send training reminder emails.

**Body:**
```json
{
  "userIds": ["user-1", "user-2"],
  "courseId": "course-123",
  "customMessage": "Your training is due this Friday!"
}
```

**Response:**
```json
{
  "success": true,
  "sentCount": 10,
  "failedCount": 0,
  "total": 10
}
```

### POST /api/emails/invitations

Send course invitation emails.

**Body:**
```json
{
  "emails": "user1@example.com\nuser2@example.com",
  "courseId": "course-123",
  "customMessage": "You've been invited to join this course!"
}
```

### POST /api/emails/promotional

Send promotional emails.

**Body:**
```json
{
  "subject": "New Course Available!",
  "body": "<p>Check out our latest training...</p>",
  "userIds": ["user-1", "user-2"],
  "additionalEmails": "external@example.com",
  "ctaLink": "https://spinrlms.com/courses/new",
  "ctaText": "View Course"
}
```

### GET /api/emails/*

All email endpoints support GET to retrieve available templates:

```javascript
const res = await fetch('/api/emails/reminders');
const { templates } = await res.json();
console.log(templates); // [{ type: 'training_reminder', name: '...', subject: '...' }]
```

---

## Environment Variables

Required in `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=Spinr Training <noreply@training.spinr.ca>
EMAIL_REPLY_TO=support@spinr.ca

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://spinrlms.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

---

## Rate Limiting

The email system uses **Resend** which has these limits on the free tier:

- **100 emails per day**
- **2 emails per second**

The `sendBulkEmails` function automatically adds delays between emails to respect these limits.

---

## Admin UI

### Manage Templates

Go to `/admin/email-templates` to:

1. **Create** new templates
2. **Edit** existing templates (visual or HTML mode)
3. **Preview** templates with sample data
4. **Reset** templates to defaults
5. **Delete** templates

### Send Emails

Go to `/admin/emails` to:

1. **Promotional Emails** - Send custom emails to selected users
2. **Training Reminders** - Remind users about pending training
3. **Course Invitations** - Invite new users to courses
4. **Export Users** - Export user lists to CSV

---

## Troubleshooting

### Template Not Found

```
Error: Template "training_reminder" not found in database
```

**Solution:** Go to `/admin/email-templates` and create the template.

### Rate Limit Exceeded

```
Error: 429 Too Many Requests
```

**Solution:** The system automatically retries with exponential backoff. Wait a moment and try again.

### Variables Not Replacing

Check that:
1. Variable names match exactly (case-sensitive): `{{userName}}` not `{{Username}}`
2. Variables are provided in the `variables` object
3. For conditional blocks, use matching open/close tags: `{{#var}}...{{/var}}`

---

## Migration from Hardcoded Templates

If you were using the old hardcoded templates:

**Before:**
```javascript
import { trainingReminderTemplate, EmailConfig } from '@/lib/email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const html = trainingReminderTemplate({ userName, courseTitle, dashboardLink });

await resend.emails.send({
  from: EmailConfig.from,
  to: [email],
  subject: 'Training Reminder',
  html,
});
```

**After:**
```javascript
import { sendEmailFromTemplate } from '@/lib/email';

await sendEmailFromTemplate({
  to: email,
  templateType: 'training_reminder',
  variables: { userName, courseTitle, dashboardLink },
});
```

Benefits:
- Templates are editable in the admin UI
- No code changes needed to update email content
- Consistent template system across all email types

---

## Security Notes

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the client
2. Email sending should only happen in Server Components or API routes
3. Validate all user inputs before using in templates
4. Use parameterized variables, never concatenate HTML directly
