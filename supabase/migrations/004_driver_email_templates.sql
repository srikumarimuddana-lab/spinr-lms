-- =====================================================
-- Driver-specific Email Templates
-- =====================================================

-- Add driver invitation template (updated version)
INSERT INTO email_templates (type, name, subject, html) VALUES
('driver_invitation', 'Driver Training Invitation', 'Complete Your Spinr Driver Training',
'<h2>Welcome to Spinr Driver Training!</h2>

<p>Hi {{userName}},</p>

<p>Congratulations on being approved as a Spinr driver! To begin accepting rides, you need to complete our mandatory driver training program.</p>

<div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
  <h3 style="margin: 0 0 8px 0; color: #1f2937;">What you''ll learn:</h3>
  <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
    <li>Safe driving practices</li>
    <li>Customer service excellence</li>
    <li>App navigation and features</li>
    <li>City regulations and compliance</li>
  </ul>
</div>

<p>The training takes approximately 30 minutes to complete.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{signupLink}}"
         style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Start Training Now
      </a>
    </td>
  </tr>
</table>

<p style="color: #6b7280; font-size: 14px;">
  <strong>Note:</strong> You must complete this training before you can start accepting rides.
</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  Questions? Reply to this email or contact support@spinr.ca<br>
  &copy; 2026 Spinr Mobility Inc. All rights reserved.
</p>'),

('driver_reminder', 'Driver Training Reminder', 'Reminder: Complete Your Spinr Training',
'<h2>Don''t Forget Your Training!</h2>

<p>Hi {{userName}},</p>

<p>We noticed you haven''t completed your Spinr Driver Training yet. Complete your training to start accepting rides!</p>

{{#progressInfo}}
<div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
  <p style="margin: 0; color: #92400e;">
    <strong>Your Progress:</strong> {{progressInfo}}
  </p>
</div>
{{/progressInfo}}

<p>The training only takes about 30 minutes and covers everything you need to know.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{dashboardLink}}"
         style="display: inline-block; background-color: #4F46E5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Continue Training
      </a>
    </td>
  </tr>
</table>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  Need help? Reply to this email or contact support@spinr.ca<br>
  &copy; 2026 Spinr Mobility Inc. All rights reserved.
</p>'),

('driver_completion', 'Training Completion Confirmation', 'Congratulations! Training Complete',
'<h2>Training Complete!</h2>

<p>Hi {{userName}},</p>

<p>Congratulations on completing your Spinr Driver Training!</p>

<div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
  <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #065f46;">
    Certificate Number: {{certificateNumber}}
  </p>
  <p style="margin: 0; color: #047857;">
    Issued: {{issueDate}}
  </p>
</div>

<p>You are now authorized to start accepting rides through the Spinr platform.</p>

<table role="presentation" style="margin: 24px 0; width: 100%;">
  <tr>
    <td align="center">
      <a href="{{certificateLink}}"
         style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Certificate
      </a>
    </td>
  </tr>
</table>

<p style="color: #6b7280; font-size: 14px;">
  Keep this email for your records. Your certificate may be required for insurance or regulatory purposes.
</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

<p style="color: #6b7280; font-size: 14px;">
  Thank you for being part of the Spinr family!<br>
  &copy; 2026 Spinr Mobility Inc. All rights reserved.
</p>')

ON CONFLICT (type) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  html = EXCLUDED.html,
  updated_at = NOW();
