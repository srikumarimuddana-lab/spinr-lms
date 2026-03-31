import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/drivers/history
 * Get upload history and communication logs
 */
export async function GET(request) {
  const { response } = await requireAdmin();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'uploads'; // 'uploads' or 'communications'
    const driverId = searchParams.get('driver_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const supabase = await createServiceClient();

    if (type === 'uploads') {
      const { data, error } = await supabase
        .from('driver_upload_history')
        .select('*, lms_users(full_name)')
        .order('uploaded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    if (type === 'communications') {
      let query = supabase
        .from('driver_communication_log')
        .select('*, driver_records(full_name, email, phone)')
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
