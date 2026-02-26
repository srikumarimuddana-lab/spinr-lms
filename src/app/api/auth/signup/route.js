import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request) {
    try {
        const { userId, email, fullName } = await request.json();

        if (!userId || !email || !fullName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createServiceClient();
        const { error } = await supabase.from('lms_users').insert({
            id: userId,
            email,
            full_name: fullName,
            role: 'driver',
        });

        if (error) {
            console.error('Error creating lms_user:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Create audit log entry
        await supabase.from('audit_log').insert({
            user_id: userId,
            action: 'account_created',
            entity_type: 'user',
            entity_id: userId,
            details: { email, full_name: fullName },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
