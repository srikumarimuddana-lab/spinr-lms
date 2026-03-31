import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

/**
 * Create an lms_users record for a newly registered user
 * 
 * SECURITY: This endpoint verifies that the authenticated user matches the userId
 * being registered to prevent identity hijacking attacks.
 */
export async function POST(request) {
    try {
        const { fullName } = await request.json();

        if (!fullName) {
            return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
        }

        // Get the authenticated user from the session
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized - must be logged in' }, { status: 401 });
        }

        // Use the authenticated user's ID and email - never accept these from the client
        const userId = user.id;
        const email = user.email;

        const serviceClient = await createServiceClient();

        // Check if user record already exists
        const { data: existing } = await serviceClient
            .from('lms_users')
            .select('id')
            .eq('id', userId)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: true, message: 'User record already exists' });
        }

        // Create the lms_users record
        const { error } = await serviceClient.from('lms_users').insert({
            id: userId,
            email,
            full_name: fullName,
            role: 'driver',
        });

        if (error) {
            // Handle duplicate key error gracefully (race condition)
            if (error.code === '23505') {
                return NextResponse.json({ success: true, message: 'User record already exists' });
            }
            console.error('Error creating lms_user:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Create audit log entry
        const { error: auditError } = await serviceClient.from('audit_log').insert({
            user_id: userId,
            action: 'account_created',
            entity_type: 'user',
            entity_id: userId,
            details: { email, full_name: fullName },
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        });

        if (auditError) {
            console.error('Failed to create audit log:', auditError);
            // Don't fail the request for audit log issues
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signup API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
