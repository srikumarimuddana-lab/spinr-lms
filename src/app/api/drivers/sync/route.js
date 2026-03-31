import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * POST /api/drivers/sync
 * Sync all driver records with lms_users to update training status
 * This checks emails and links driver records with registered LMS users
 */
export async function POST(request) {
  const { response, lmsUser } = await requireAdmin();
  if (response) return response;

  try {
    const supabase = await createServiceClient();

    // Get all driver records that are not yet linked or not completed
    const { data: drivers, error: driversError } = await supabase
      .from('driver_records')
      .select('id, email, lms_user_id, training_status')
      .neq('training_status', 'completed');

    if (driversError) throw driversError;

    let synced = 0;
    let alreadyLinked = 0;
    let notRegistered = 0;

    for (const driver of drivers) {
      // Check if driver's email exists in lms_users
      const { data: lmsUserData } = await supabase
        .from('lms_users')
        .select('id')
        .eq('email', driver.email.toLowerCase())
        .single();

      if (lmsUserData) {
        // User is registered in LMS
        let trainingStatus = 'registered';

        // Check enrollment status
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('status')
          .eq('user_id', lmsUserData.id)
          .order('enrolled_at', { ascending: false })
          .limit(1)
          .single();

        if (enrollment) {
          if (enrollment.status === 'completed') {
            trainingStatus = 'completed';
          } else if (enrollment.status === 'in_progress') {
            trainingStatus = 'in_progress';
          }
        }

        // Update driver record if needed
        if (driver.lms_user_id !== lmsUserData.id || driver.training_status !== trainingStatus) {
          await supabase
            .from('driver_records')
            .update({
              lms_user_id: lmsUserData.id,
              training_status: trainingStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', driver.id);

          synced++;
        } else {
          alreadyLinked++;
        }
      } else {
        notRegistered++;
      }
    }

    // Log audit entry
    await supabase.from('audit_log').insert({
      user_id: lmsUser.id,
      action: 'driver_sync_lms',
      entity_type: 'driver_records',
      details: {
        total_checked: drivers.length,
        synced,
        already_linked: alreadyLinked,
        not_registered: notRegistered,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        totalChecked: drivers.length,
        synced,
        alreadyLinked,
        notRegistered,
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/drivers/sync
 * Get sync status - how many drivers need syncing
 */
export async function GET(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const supabase = await createServiceClient();

    // Get drivers without lms_user_id but might be registered
    const { data: unlinkedDrivers } = await supabase
      .from('driver_records')
      .select('email')
      .is('lms_user_id', null);

    // Get all lms_users emails
    const { data: lmsUsers } = await supabase
      .from('lms_users')
      .select('email');

    const lmsEmails = new Set(lmsUsers?.map(u => u.email.toLowerCase()) || []);
    
    let needsSync = 0;
    if (unlinkedDrivers) {
      for (const driver of unlinkedDrivers) {
        if (lmsEmails.has(driver.email.toLowerCase())) {
          needsSync++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        unlinkedDrivers: unlinkedDrivers?.length || 0,
        lmsUsersCount: lmsUsers?.length || 0,
        needsSync,
      },
    });
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
