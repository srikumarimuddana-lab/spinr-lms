# Send Email from Template - Admin Guide

## Overview

The **Send Email** page (`/admin/send-email`) provides a user-friendly interface to send emails using your database templates. No coding required!

---

## Features

- **Select from saved templates** - All templates from `/admin/email-templates` are available
- **Variable substitution** - Fill in template variables like `{{userName}}`, `{{courseTitle}}`, etc.
- **Recipient selection** - Choose from existing drivers and/or add external emails
- **Live preview** - See how your email will look before sending
- **Bulk sending** - Send to multiple recipients at once with automatic rate limiting

---

## How to Use

### Step 1: Select a Template

1. Go to `/admin/send-email`
2. Choose a template from the dropdown:
   - **Password Reset** - Send password reset instructions
   - **Email Verification** - Verify a user's email address
   - **Training Reminder** - Remind users about pending training
   - **Course Invitation** - Invite users to enroll in a course
   - **Promotional** - Marketing/promotional emails
   - **Account Notification** - Account-related notifications

### Step 2: Fill in Variables

Each template has variables that get replaced with actual content:

#### Training Reminder Variables
| Variable | Example |
|----------|---------|
| userName | John Doe |
| courseTitle | Workplace Safety Training |
| dashboardLink | https://spinrlms.com/dashboard |

#### Course Invitation Variables
| Variable | Example |
|----------|---------|
| userName | John Doe |
| courseTitle | Defensive Driving |
| courseDescription | Learn safe driving techniques... |
| signupLink | https://spinrlms.com/signup |

#### Promotional Email Variables
| Variable | Example |
|----------|---------|
| subject | New Course Available! |
| preheader | Check out our latest training... |
| content | `<p>Dear valued driver...</p>` |
| ctaLink | https://spinrlms.com/courses |
| ctaText | View Course |

### Step 3: Select a Course (Optional)

For **Training Reminder** and **Course Invitation** templates, you can select a specific course to include in the email.

### Step 4: Add Custom Message (Optional)

Add a personalized message that will be included in the email.

### Step 5: Select Recipients

**Option A: Select from Drivers**
- Click "Select All Drivers" to select everyone
- Or click individual drivers from the list
- The counter shows how many are selected

**Option B: Add Additional Emails**
- Enter external email addresses (one per line)
- These can be people not in your system yet

### Step 6: Preview

Click **Preview** to see how the email will look:
- Variables are replaced with your content
- Template formatting is preserved
- CTA buttons are rendered

### Step 7: Send

Click **Send Email** to send. You'll see:
- Success message with count of sent emails
- Failed count if any emails couldn't be sent

---

## Rate Limiting

The email system uses **Resend** which has limits:

| Plan | Daily Limit | Per Second |
|------|-------------|------------|
| Free | 100 emails | 2 emails |
| Pro | 10,000 emails | 100 emails |

The system automatically adds delays between emails to respect these limits.

---

## Troubleshooting

### "Please fill in: userName, courseTitle"

You're missing required variables. Fill in all the variable fields before sending.

### "Failed to send"

Check:
1. Your `RESEND_API_KEY` in environment variables
2. Resend dashboard for error details
3. That you haven't hit the daily limit

### Preview shows `[variableName]`

This means the variable wasn't filled in. Make sure all variable fields have content.

---

## Tips

### Best Practices

1. **Personalize** - Always use the recipient's name when possible
2. **Clear subject** - Make the subject line compelling and clear
3. **Single CTA** - For promotional emails, focus on one call-to-action
4. **Test first** - Send a test to yourself before bulk sending

### Variable Tips

- **userName**: Use full name for formal, first name for casual
- **Links**: Always use full URLs (https://...)
- **courseDescription**: Keep it under 200 characters for best results
- **content**: Use HTML for formatting (`<p>`, `<strong>`, `<a href="">`)

---

## Example Workflows

### Workflow 1: Remind Drivers About Pending Training

1. Select template: **Training Reminder**
2. Fill in:
   - userName: (leave blank - auto-filled per user)
   - courseTitle: Workplace Safety Training
   - dashboardLink: https://spinrlms.com/dashboard
3. Select course: Workplace Safety Training
4. Custom message: "Hi! Your training is due this Friday. Please complete it ASAP."
5. Select recipients: Users with pending training
6. Preview and Send

### Workflow 2: Invite New Hires to Orientation

1. Select template: **Course Invitation**
2. Fill in:
   - userName: (auto-filled)
   - courseTitle: New Driver Orientation
   - courseDescription: Complete orientation to get started with Spinr
   - signupLink: https://spinrlms.com/signup
3. Select course: New Driver Orientation
4. Custom message: "Welcome to the team! Please complete this orientation in your first week."
5. Additional emails: newhire1@example.com, newhire2@example.com
6. Preview and Send

### Workflow 3: Promote a New Course

1. Select template: **Promotional**
2. Fill in:
   - subject: "New: Advanced Safety Training Available!"
   - preheader: "Enhance your skills with our latest course..."
   - content: (your HTML content)
   - ctaLink: https://spinrlms.com/courses/advanced-safety
   - ctaText: Enroll Now
3. Select recipients: All drivers
4. Preview and Send

---

## API Reference

The UI uses these API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/emails/reminders` | POST | Send training reminders |
| `/api/emails/invitations` | POST | Send course invitations |
| `/api/emails/promotional` | POST | Send promotional emails |
| `/api/emails/send-from-template` | POST | Send from any template |
| `/api/emails/*` | GET | Get available templates |

---

## Related

- **Manage Templates**: `/admin/email-templates` - Create and edit templates
- **Email Communications**: `/admin/emails` - Legacy email interface
- **Documentation**: `/docs/EMAIL_TEMPLATE_USAGE.md` - Developer guide
