import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/drivers/groups
 * Get all driver groups with counts
 */
export async function GET(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const supabase = await createServiceClient();

    // Get all groups
    const { data: groups, error } = await supabase
      .from('driver_groups')
      .select('*')
      .order('is_system_group', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get counts for each group
    const groupsWithCounts = await Promise.all(groups.map(async (group) => {
      const count = await getGroupDriverCount(supabase, group);
      return { ...group, driver_count: count };
    }));

    return NextResponse.json({
      success: true,
      data: groupsWithCounts,
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/drivers/groups
 * Create a new custom driver group
 */
export async function POST(request) {
  const { response, lmsUser } = await requireAdmin();
  if (response) return response;

  try {
    const body = await request.json();
    const { name, description, driver_ids } = body;

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Create group
    const { data: group, error } = await supabase
      .from('driver_groups')
      .insert({
        name,
        description,
        is_system_group: false,
        created_by: lmsUser.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add members if provided
    if (driver_ids && driver_ids.length > 0) {
      const members = driver_ids.map(driverId => ({
        group_id: group.id,
        driver_id: driverId,
      }));

      await supabase.from('driver_group_members').insert(members);
    }

    return NextResponse.json({
      success: true,
      data: group,
    });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Get driver count for a group
 */
async function getGroupDriverCount(supabase, group) {
  if (group.is_system_group && group.filter_criteria) {
    // Dynamic group - query based on criteria
    let query = supabase
      .from('driver_records')
      .select('*', { count: 'exact', head: true });

    const criteria = group.filter_criteria;

    if (criteria.spinr_approved !== undefined) {
      query = query.eq('spinr_approved', criteria.spinr_approved);
    }

    if (criteria.training_status) {
      if (Array.isArray(criteria.training_status)) {
        query = query.in('training_status', criteria.training_status);
      } else {
        query = query.eq('training_status', criteria.training_status);
      }
    }

    const { count } = await query;
    return count || 0;
  } else {
    // Manual group - count members
    const { count } = await supabase
      .from('driver_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id);

    return count || 0;
  }
}
