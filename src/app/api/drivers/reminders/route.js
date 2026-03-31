import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';
import { sendEmailFromTemplate } from '@/lib/email';
import { sendSMSWithRetry, checkOptOutStatus } from '@/lib/twilio-client';

/**
 * POST /api/drivers/reminders
 * Send automated reminders to drivers based on their training status
 * 
 * Body:
 * - target_group: 'not_registered' | 'in_progress' | 'all_pending'
 * - communication_type: 'email' | 'sms' | 'both'
 * - min_days_since_last_reminder: Minimum days since last reminder (default 3)
 * - dry_run: If true, just return the drivers that would be contacted
 */
export async function POST(request) {
  const { response, lmsUser } = await requireAdmin();
  if (response) return response;

  try {
    const body = await request.json();
    const {
      target_group = 'all_pending',
      communication_type = 'email',
      min_days_since_last_reminder = 3,
      dry_run = false,
    } = body;

    const supabase = await createServiceClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://training.spinr.ca';

    // Calculate the cutoff date for last reminder
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - min_days_since_last_reminder);

    // Build query based on target group
    let query = supabase
      .from('driver_records')
      .select('*')
      .eq('spinr_approved', true)
      .neq('training_status', 'completed');

    // Apply target group filter
    switch (target_group) {
      case 'not_registered':
        query = query.in('training_status', ['not_invited', 'invited']);
        break;
      case 'in_progress':
        query = query.in('training_status', ['registered', 'in_progress']);
        break;
      case 'all_pending':
        // Include all non-completed
        break;
      default:
        return NextResponse.json({ error: 'Invalid target_group' }, { status: 400 });
    }

    // Filter by last reminder date (null or before cutoff)
    query = query.or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${cutoffDate.toISOString()}`);

    const { data: drivers, error } = await query;

    if (error) throw error;

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No drivers need reminders at this time',
          driversProcessed: 0,
        },
      });
    }

    // If dry run, just return the list
    if (dry_run) {
      return NextResponse.json({
        success: true,
        data: {
          dry_run: true,
          driversToContact: drivers.length,
          drivers: drivers.map(d => ({
            id: d.id,
            name: d.full_name,
            email: d.email,
            phone: d.phone,
            training_status: d.training_status,
            last_reminder: d.last_reminder_sent_at,
            reminder_count: d.reminder_count,
          })),
        },
      });
    }

    const results = {
      email: { sent: 0, failed: 0, errors: [] },
      sms: { sent: 0, failed: 0, errors: [] },
    };

    // Process each driver
    for (const driver of drivers) {
      const isNotRegistered = ['not_invited', 'invited'].includes(driver.training_status);
      const messageType = isNotRegistered ? 'invite' : 'reminder';

      // Send Email
      if (communication_type === 'email' || communication_type === 'both') {
        if (driver.email) {
          try {
            const templateType = isNotRegistered ? 'course_invitation' : 'training_reminder';
            const emailResult = await sendEmailFromTemplate({
              to: driver.email,
              templateType,
              variables: {
                userName: driver.full_name || 'Driver',
                signupLink: `${siteUrl}/signup`,
                dashboardLink: `${siteUrl}/dashboard`,
                courseTitle: 'Spinr Driver Training',
                courseName: 'Spinr Driver Training',
              },
            });

            if (!emailResult.error) {
              results.email.sent++;
              
              // Log communication
              await supabase.from('driver_communication_log').insert({
                driver_id: driver.id,
                communication_type: 'email',
                message_type: messageType,
                subject: isNotRegistered ? 'Training Invitation' : 'Training Reminder',
                status: 'sent',
                external_id: emailResult.data?.id,
                sent_by: lmsUser.id,
              });
            } else {
              results.email.failed++;
              results.email.errors.push({ email: driver.email, error: emailResult.error.message });
            }
          } catch (err) {
            results.email.failed++;
            results.email.errors.push({ email: driver.email, error: err.message });
          }
        }
      }

      // Send SMS
      if (communication_type === 'sms' || communication_type === 'both') {
        if (driver.phone) {
          try {
            const optOutStatus = await checkOptOutStatus(driver.phone);
            if (!optOutStatus.isOptedOut) {
              const smsMessage = isNotRegistered
                ? `Hi ${driver.full_name || 'Driver'}! You're invited to complete Spinr Driver Training. Sign up: ${siteUrl}/signup - Spinr`
                : `Hi ${driver.full_name || 'Driver'}! Reminder: Complete your Spinr training. Log in: ${siteUrl}/login - Spinr`;

              const smsResult = await sendSMSWithRetry(driver.phone, smsMessage);

              if (smsResult.success) {
                results.sms.sent++;
                
                // Log communication
                await supabase.from('driver_communication_log').insert({
                  driver_id: driver.id,
                  communication_type: 'sms',
                  message_type: messageType,
                  message_body: smsMessage,
                  status: 'sent',
                  external_id: smsResult.sid,
                  sent_by: lmsUser.id,
                });
              } else {
                results.sms.failed++;
                results.sms.errors.push({ phone: driver.phone, error: smsResult.error });
              }
            } else {
              results.sms.failed++;
              results.sms.errors.push({ phone: driver.phone, error: 'Opted out' });
            }
          } catch (err) {
            results.sms.failed++;
            results.sms.errors.push({ phone: driver.phone, error: err.message });
          }
        }
      }

      // Update driver reminder tracking
      const newStatus = driver.training_status === 'not_invited' ? 'invited' : driver.training_status;
      await supabase
        .from('driver_records')
        .update({
          training_status: newStatus,
          last_reminder_sent_at: new Date().toISOString(),
          reminder_count: (driver.reminder_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', driver.id);
    }

    // Log audit entry
    await supabase.from('audit_log').insert({
      user_id: lmsUser.id,
      action: 'driver_bulk_reminders',
      entity_type: 'driver_records',
      details: {
        target_group,
        communication_type,
        drivers_processed: drivers.length,
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
    console.error('Reminder sending error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/drivers/reminders
 * Get reminder statistics and history
 */
export async function GET(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const supabase = await createServiceClient();

    // Get reminder stats
    const [pendingDrivers, recentReminders] = await Promise.all([
      // Drivers needing reminders
      supabase
        .from('driver_records')
        .select('training_status', { count: 'exact' })
        .eq('spinr_approved', true)
        .neq('training_status', 'completed'),
      
      // Recent communications
      supabase
        .from('driver_communication_log')
        .select('*, driver_records(full_name, email)')
        .order('sent_at', { ascending: false })
        .limit(50),
    ]);

    // Group pending drivers by status
    const pendingByStatus = {};
    if (pendingDrivers.data) {
      pendingDrivers.data.forEach(d => {
        pendingByStatus[d.training_status] = (pendingByStatus[d.training_status] || 0) + 1;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingDrivers: {
          total: pendingDrivers.count || 0,
          byStatus: pendingByStatus,
        },
        recentCommunications: recentReminders.data || [],
      },
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
