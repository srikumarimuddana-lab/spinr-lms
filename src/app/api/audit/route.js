import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request) {
    try {
        const { action, entityType, entityId, details } = await request.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { createServiceClient } = await import('@/lib/supabase-server');
        const serviceClient = await createServiceClient();

        await serviceClient.from('audit_log').insert({
            user_id: user?.id,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
