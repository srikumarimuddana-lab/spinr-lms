import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';
import { sendEmailFromTemplate, sendBulkEmails } from '@/lib/email';
import { sendSMSWithRetry, checkOptOutStatus } from '@/lib/twilio-client';

/**
 * POST /api/drivers/communicate
 * Send communications to drivers (email and/or SMS)
 * 
 * Body:
 * - driver_ids: Array of driver IDs (optional if group specified)
 * - group: Group name to send to (optional if driver_ids specified)
 * - communication_type: 'email', 'sms', or 'both'
 * - message_type: 'invite', 'reminder', 'custom'
 * - email_template: Template type for email (optional for custom)
 * - email_subject: Custom email subject (for custom type)
 * - email_body: Custom email body (for custom type)
 * - sms_message: SMS message text
 * - update_status: Whether to update driver status (for invites)
 */
export async function POST(request) {
  const { response, lmsUser } = await requireAdmin();
  if (response) return response;

  try {
    const body = await request.json();
    const {
      driver_ids,
      group,
      communication_type,
      message_type,
      email_template,
      email_subject,
      email_body,
      sms_message,
      update_status = false,
    } = body;

    if (!communication_type || !['email', 'sms', 'both'].includes(communication_type)) {
      return NextResponse.json({ error: 'Invalid communication type' }, { status: 400 });
    }

    if (!message_type || !['invite', 'reminder', 'custom'].includes(message_type)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Get drivers to communicate with
    let drivers = [];
    if (driver_ids && driver_ids.length > 0) {
      const { data, error } = await supabase
        .from('driver_records')
        .select('*')
        .in('id', driver_ids);
      if (error) throw error;
      drivers = data;
    } else if (group) {
      drivers = await getDriversByGroup(supabase, group);
    } else {
      return NextResponse.json({ error: 'Must provide driver_ids or group' }, { status: 400 });
    }

    if (drivers.length === 0) {
      return NextResponse.json({ error: 'No drivers found' }, { status: 400 });
    }

    const results = {
      email: { sent: 0, failed: 0, errors: [] },
      sms: { sent: 0, failed: 0, errors: [] },
    };

    // Process each driver
    for (const driver of drivers) {
      // Send Email
      if (communication_type === 'email' || communication_type === 'both') {
        if (driver.email) {
          try {
            const emailResult = await sendDriverEmail(
              supabase,
              driver,
              message_type,
              email_template,
              email_subject,
              email_body,
              lmsUser.id
            );

            if (emailResult.success) {
              results.email.sent++;
            } else {
              results.email.failed++;
              results.email.errors.push({ email: driver.email, error: emailResult.error });
            }
          } catch (err) {
            results.email.failed++;
            results.email.errors.push({ email: driver.email, error: err.message });
          }
        } else {
          results.email.failed++;
          results.email.errors.push({ name: driver.full_name, error: 'No email address' });
        }
      }

      // Send SMS
      if (communication_type === 'sms' || communication_type === 'both') {
        if (driver.phone) {
          try {
            const smsResult = await sendDriverSMS(
              supabase,
              driver,
              message_type,
              sms_message,
              lmsUser.id
            );

            if (smsResult.success) {
              results.sms.sent++;
            } else {
              results.sms.failed++;
              results.sms.errors.push({ phone: driver.phone, error: smsResult.error });
            }
          } catch (err) {
            results.sms.failed++;
            results.sms.errors.push({ phone: driver.phone, error: err.message });
          }
        } else {
          results.sms.failed++;
          results.sms.errors.push({ name: driver.full_name, error: 'No phone number' });
        }
      }

      // Update driver status if sending invites
      if (update_status && message_type === 'invite' && driver.training_status === 'not_invited') {
        await supabase
          .from('driver_records')
          .update({
            training_status: 'invited',
            last_reminder_sent_at: new Date().toISOString(),
            reminder_count: (driver.reminder_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', driver.id);
      }

      // Update reminder count for reminders
      if (message_type === 'reminder') {
        await supabase
          .from('driver_records')
          .update({
            last_reminder_sent_at: new Date().toISOString(),
            reminder_count: (driver.reminder_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', driver.id);
      }
    }

    // Log audit entry
    await supabase.from('audit_log').insert({
      user_id: lmsUser.id,
      action: 'driver_communication',
      entity_type: 'driver_records',
      details: {
        communication_type,
        message_type,
        group,
        driver_count: drivers.length,
        results,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        driversProcessed: drivers.length,
        results,
      },
    });
  } catch (error) {
    console.error('Communication error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Send email to a driver
 */
async function sendDriverEmail(supabase, driver, messageType, template, subject, body, sentBy) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://training.spinr.ca';
  
  let emailResult;
  
  if (messageType === 'custom' && subject && body) {
    // Custom email - use Resend directly
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Replace variables in body
    const processedBody = body
      .replace(/\{\{name\}\}/gi, driver.full_name || 'Driver')
      .replace(/\{\{email\}\}/gi, driver.email)
      .replace(/\{\{signupLink\}\}/gi, `${siteUrl}/signup`)
      .replace(/\{\{dashboardLink\}\}/gi, `${siteUrl}/dashboard`)
      .replace(/\{\{signupUrl\}\}/gi, `${siteUrl}/signup`)
      .replace(/\{\{loginUrl\}\}/gi, `${siteUrl}/login`);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS || 'Spinr Training <training@spinr.ca>',
      to: driver.email,
      subject: subject.replace(/\{\{name\}\}/gi, driver.full_name || 'Driver'),
      html: processedBody,
    });

    if (error) {
      emailResult = { success: false, error: error.message };
    } else {
      emailResult = { success: true, messageId: data?.id };
    }
  } else {
    // Template-based email
    const templateType = template || (messageType === 'invite' ? 'course_invitation' : 'training_reminder');
    
    emailResult = await sendEmailFromTemplate({
      to: driver.email,
      templateType,
      variables: {
        userName: driver.full_name || 'Driver',
        email: driver.email,
        signupLink: `${siteUrl}/signup`,
        dashboardLink: `${siteUrl}/dashboard`,
        courseTitle: 'Spinr Driver Training',
        courseName: 'Spinr Driver Training',
      },
    });
  }

  // Log communication
  await supabase.from('driver_communication_log').insert({
    driver_id: driver.id,
    communication_type: 'email',
    message_type: messageType,
    subject: subject || (messageType === 'invite' ? 'Training Invitation' : 'Training Reminder'),
    message_body: body || `Template: ${template || messageType}`,
    status: emailResult.success ? 'sent' : 'failed',
    external_id: emailResult.messageId,
    error_message: emailResult.error,
    sent_by: sentBy,
  });

  return emailResult;
}

/**
 * Send SMS to a driver
 */
async function sendDriverSMS(supabase, driver, messageType, message, sentBy) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://training.spinr.ca';
  
  // Check opt-out status
  const optOutStatus = await checkOptOutStatus(driver.phone);
  if (optOutStatus.isOptedOut) {
    return { success: false, error: 'Phone number has opted out of SMS' };
  }

  // Default messages if not provided
  let smsMessage = message;
  if (!smsMessage) {
    if (messageType === 'invite') {
      smsMessage = `Hi ${driver.full_name || 'Driver'}! You're invited to complete your Spinr Driver Training. Sign up at ${siteUrl}/signup - Spinr Team`;
    } else {
      smsMessage = `Hi ${driver.full_name || 'Driver'}! Reminder to complete your Spinr Driver Training. Log in at ${siteUrl}/login - Spinr Team`;
    }
  } else {
    // Replace variables
    smsMessage = smsMessage
      .replace(/\{\{name\}\}/gi, driver.full_name || 'Driver')
      .replace(/\{\{signupLink\}\}/gi, `${siteUrl}/signup`)
      .replace(/\{\{dashboardLink\}\}/gi, `${siteUrl}/dashboard`)
      .replace(/\{\{signupUrl\}\}/gi, `${siteUrl}/signup`)
      .replace(/\{\{loginUrl\}\}/gi, `${siteUrl}/login`);
  }

  try {
    const result = await sendSMSWithRetry(driver.phone, smsMessage);
    
    // Log communication
    await supabase.from('driver_communication_log').insert({
      driver_id: driver.id,
      communication_type: 'sms',
      message_type: messageType,
      message_body: smsMessage,
      status: 'sent',
      external_id: result?.sid,
      sent_by: sentBy,
    });

    return { success: true, sid: result?.sid };
  } catch (error) {
    // Log failed communication
    await supabase.from('driver_communication_log').insert({
      driver_id: driver.id,
      communication_type: 'sms',
      message_type: messageType,
      message_body: smsMessage,
      status: 'failed',
      error_message: error.message,
      sent_by: sentBy,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Get drivers by group name
 */
async function getDriversByGroup(supabase, groupName) {
  let query = supabase.from('driver_records').select('*');

  switch (groupName.toLowerCase().replace(/_/g, ' ')) {
    case 'all spinr approved':
      query = query.eq('spinr_approved', true);
      break;
    case 'training completed':
      query = query.eq('spinr_approved', true).eq('training_status', 'completed');
      break;
    case 'registered not completed':
      query = query.eq('spinr_approved', true).in('training_status', ['registered', 'in_progress']);
      break;
    case 'not registered':
      query = query.eq('spinr_approved', true).in('training_status', ['not_invited', 'invited']);
      break;
    case 'needs reminder':
      query = query.eq('spinr_approved', true).in('training_status', ['invited', 'registered', 'in_progress']);
      break;
    default:
      // Custom group - get members
      const { data: group } = await supabase
        .from('driver_groups')
        .select('id')
        .eq('name', groupName)
        .single();

      if (group) {
        const { data: members } = await supabase
          .from('driver_group_members')
          .select('driver_id')
          .eq('group_id', group.id);

        if (members && members.length > 0) {
          const driverIds = members.map(m => m.driver_id);
          query = supabase.from('driver_records').select('*').in('id', driverIds);
        } else {
          return [];
        }
      } else {
        return [];
      }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
