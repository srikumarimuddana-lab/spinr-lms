# Spinr LMS - Setup Instructions

## Quick Start

### 1. Run Database Migrations in Supabase

1. Go to https://app.supabase.com and select your project
2. Navigate to **SQL Editor** → **New Query**
3. Copy and paste the contents of `supabase/migrations/001_email_templates.sql`
4. Click **Run** or press `Ctrl+Enter`

This will create:
- `email_templates` table
- Default email templates (password reset, email verification, training reminder, course invitation)
- Row Level Security (RLS) policies
- Indexes for performance

### 2. Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM_ADDRESS=Spinr Training <noreply@training.spinr.ca>
EMAIL_REPLY_TO=support@spinr.ca

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Configure Supabase Authentication

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (or your production URL)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (production)

### 4. Configure Supabase Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:

**Password Reset:**
```html
<h2>Reset Your Password</h2>
<p>Hi {{ .Email }},</p>
<p>We received a request to reset your password.</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
```

**Email Signup:**
```html
<h2>Verify Your Email</h2>
<p>Welcome to Spinr LMS!</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
```

### 5. Install Dependencies and Run

```bash
cd spinr-lms
npm install
npm run dev
```

Open http://localhost:3000

---

## Features

### Password Reset Flow
- ✅ Fixed redirect to reset-password page
- ✅ Error handling for expired/invalid links
- ✅ Session invalidation after password change
- ✅ Auto-redirect to login after success

### Email Templates
- ✅ Centralized template system
- ✅ Admin UI at `/admin/email-templates`
- ✅ Visual and HTML editors
- ✅ Template preview
- ✅ 6 built-in templates

### Email Types
1. **Authentication** (Supabase)
   - Password Reset
   - Email Verification

2. **Application** (Resend)
   - Training Reminder
   - Course Invitation
   - Promotional Email
   - Account Notification

---

## Testing Password Reset

1. Go to http://localhost:3000/forgot-password
2. Enter your email
3. Click "Send Reset Link"
4. Check email for reset link
5. Click link → should redirect to `/reset-password`
6. Enter new password
7. Should auto-redirect to `/login`

---

## Admin Email Templates

1. Log in as admin
2. Go to `/admin/email-templates`
3. Create, edit, preview templates
4. Use variables like `{{userName}}`, `{{resetLink}}`, etc.

---

## Troubleshooting

### Password reset link goes to homepage
- Check Supabase redirect URL is set to `http://localhost:3000/auth/callback`

### Email not sending
- Verify `RESEND_API_KEY` in `.env.local`
- Check Resend dashboard at https://resend.com

### Template not loading
- Run the SQL migration in Supabase
- Check browser console for errors

---

## File Structure

```
spinr-lms/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── email-templates/page.js  ← NEW: Template management UI
│   │   │   └── layout.js                ← Updated: Added Templates nav
│   │   ├── auth/callback/route.js       ← Fixed: Error handling
│   │   ├── forgot-password/page.js      ← Fixed: SSR issue
│   │   └── reset-password/page.js       ← Fixed: Session invalidation
│   ├── lib/
│   │   └── email/
│   │       ├── templates.js             ← NEW: Email templates
│   │       └── index.js                 ← NEW: Module exports
│   └── app/api/emails/                  ← Updated: Use templates
├── supabase/
│   └── migrations/
│       └── 001_email_templates.sql      ← NEW: Database migration
├── docs/
│   └── EMAIL_TEMPLATES_GUIDE.md         ← NEW: Documentation
└── .env.example                         ← Updated: Email config
```

---

## Next Steps

1. ✅ Run SQL migration (step 1)
2. ✅ Configure environment variables (step 2)
3. ✅ Configure Supabase auth URLs (step 3)
4. ✅ Test password reset flow
5. ✅ Customize email templates in admin panel
