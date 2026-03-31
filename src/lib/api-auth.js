import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Verify that the request is from an authenticated user
 * Returns { user, lmsUser, error, response } where response is a 401 NextResponse if auth fails
 */
export async function requireAuth() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            user: null,
            lmsUser: null,
            error: 'Unauthorized',
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    return { user, lmsUser: null, error: null, response: null };
}

/**
 * Verify that the request is from an authenticated admin user
 * Returns { user, lmsUser, error, response } where response is a 401/403 NextResponse if auth fails
 */
export async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return {
            user: null,
            lmsUser: null,
            error: 'Unauthorized',
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    // Check admin role using service client to bypass RLS
    const serviceClient = await createServiceClient();
    const { data: lmsUser, error: roleError } = await serviceClient
        .from('lms_users')
        .select('id, role, email, full_name')
        .eq('id', user.id)
        .single();

    if (roleError || !lmsUser || lmsUser.role !== 'admin') {
        return {
            user,
            lmsUser,
            error: 'Forbidden - Admin access required',
            response: NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 }),
        };
    }

    return { user, lmsUser, error: null, response: null };
}
