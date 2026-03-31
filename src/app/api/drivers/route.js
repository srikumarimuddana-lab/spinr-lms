import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/drivers
 * Get all drivers with optional filtering
 * 
 * Query params:
 * - group: Filter by system group name
 * - training_status: Filter by training status
 * - spinr_approved: Filter by spinr approval
 * - city: Filter by city
 * - search: Search by name, email, or phone
 * - page: Page number (default 1)
 * - limit: Records per page (default 50)
 */
export async function GET(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');
    const trainingStatus = searchParams.get('training_status');
    const spinrApproved = searchParams.get('spinr_approved');
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const supabase = await createServiceClient();

    // Build query
    let query = supabase
      .from('driver_records')
      .select('*', { count: 'exact' });

    // Apply group filters
    if (group) {
      switch (group) {
        case 'all_spinr_approved':
        case 'All Spinr Approved':
          query = query.eq('spinr_approved', true);
          break;
        case 'training_completed':
        case 'Training Completed':
          query = query
            .eq('spinr_approved', true)
            .eq('training_status', 'completed');
          break;
        case 'registered_not_completed':
        case 'Registered Not Completed':
          query = query
            .eq('spinr_approved', true)
            .in('training_status', ['registered', 'in_progress']);
          break;
        case 'not_registered':
        case 'Not Registered':
          query = query
            .eq('spinr_approved', true)
            .in('training_status', ['not_invited', 'invited']);
          break;
        case 'needs_reminder':
        case 'Needs Reminder':
          query = query
            .eq('spinr_approved', true)
            .in('training_status', ['invited', 'registered', 'in_progress']);
          break;
      }
    }

    // Apply individual filters
    if (trainingStatus && !group) {
      query = query.eq('training_status', trainingStatus);
    }

    if (spinrApproved !== null && spinrApproved !== undefined && !group) {
      query = query.eq('spinr_approved', spinrApproved === 'true');
    }

    // Apply city filter
    if (city) {
      query = query.eq('city', city);
    }

    // Apply search
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: drivers, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get counts for each group
    const groupCounts = await getGroupCounts(supabase);

    return NextResponse.json({
      success: true,
      data: {
        drivers,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
        groupCounts,
      },
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Get counts for each driver group
 */
async function getGroupCounts(supabase) {
  const counts = {};

  // All Spinr Approved
  const { count: allApproved } = await supabase
    .from('driver_records')
    .select('*', { count: 'exact', head: true })
    .eq('spinr_approved', true);
  counts.all_spinr_approved = allApproved || 0;

  // Training Completed
  const { count: completed } = await supabase
    .from('driver_records')
    .select('*', { count: 'exact', head: true })
    .eq('spinr_approved', true)
    .eq('training_status', 'completed');
  counts.training_completed = completed || 0;

  // Registered Not Completed
  const { count: registered } = await supabase
    .from('driver_records')
    .select('*', { count: 'exact', head: true })
    .eq('spinr_approved', true)
    .in('training_status', ['registered', 'in_progress']);
  counts.registered_not_completed = registered || 0;

  // Not Registered
  const { count: notRegistered } = await supabase
    .from('driver_records')
    .select('*', { count: 'exact', head: true })
    .eq('spinr_approved', true)
    .in('training_status', ['not_invited', 'invited']);
  counts.not_registered = notRegistered || 0;

  // Needs Reminder
  const { count: needsReminder } = await supabase
    .from('driver_records')
    .select('*', { count: 'exact', head: true })
    .eq('spinr_approved', true)
    .in('training_status', ['invited', 'registered', 'in_progress']);
  counts.needs_reminder = needsReminder || 0;

  // Total
  const { count: total } = await supabase
    .from('driver_records')
    .select('*', { count: 'exact', head: true });
  counts.total = total || 0;

  return counts;
}
