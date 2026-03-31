-- =====================================================
-- Spinr LMS - Email Templates Migration
-- Run this in Supabase SQL Editor at https://app.supabase.com
-- =====================================================

-- Email Templates Management Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100),
    subject VARCHAR(255),
    html TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO email_templates (type, name, subject, html) VALUES
('password_reset', 'Password Reset', 'Reset Your Password - Spinr LMS',
'<h2>Reset Your Password</h2>

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

<p>If you didn''t request this password reset, you can safely ignore this email.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  This is an automated message from Spinr LMS.<br>
  &copy; 2026 Spinr LMS. All rights reserved.
</p>'),

('email_verification', 'Email Verification', 'Verify Your Email - Spinr LMS',
'<h2>Verify Your Email</h2>

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

<p>If you didn''t create an account, you can safely ignore this email.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  This is an automated message from Spinr LMS.<br>
  &copy; 2026 Spinr LMS. All rights reserved.
</p>'),

('training_reminder', 'Training Reminder', 'Training Reminder - Action Required',
'<h2>Training Reminder</h2>

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
</p>'),

('course_invitation', 'Course Invitation', 'Invitation to Spinr LMS',
'<h2>Welcome to Spinr LMS!</h2>

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
</p>')

ON CONFLICT (type) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email templates
CREATE POLICY "Admins can view email templates"
    ON email_templates FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM lms_users
            WHERE lms_users.id = (SELECT auth.uid())
            AND lms_users.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert email templates"
    ON email_templates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM lms_users
            WHERE lms_users.id = (SELECT auth.uid())
            AND lms_users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update email templates"
    ON email_templates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM lms_users
            WHERE lms_users.id = (SELECT auth.uid())
            AND lms_users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete email templates"
    ON email_templates FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM lms_users
            WHERE lms_users.id = (SELECT auth.uid())
            AND lms_users.role = 'admin'
        )
    );

-- =====================================================
-- COMPLETED: Email templates migration
-- =====================================================
