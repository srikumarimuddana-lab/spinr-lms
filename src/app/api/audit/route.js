import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request) {
    try {
        // Require authentication - audit logs must have a valid user
        const auth = await requireAuth();
        if (auth.response) return auth.response;

        const { action, entityType, entityId, details } = await request.json();

        const serviceClient = await createServiceClient();

        const { error: insertError } = await serviceClient.from('audit_log').insert({
            user_id: auth.user.id,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        });

        if (insertError) {
            console.error('Audit log insert error:', insertError);
            return NextResponse.json({ error: 'Failed to write audit log' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Audit log error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
