import { NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe';
import { EmailConfig } from '@/lib/email/templates';

async function getSupabase() {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
}

// Web click unsubscribe — redirects to confirmation page
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.toLowerCase().trim();
    const token = searchParams.get('token');
    const base = EmailConfig.baseUrl;

    if (!email || !token) {
        return NextResponse.redirect(`${base}/unsubscribe?error=invalid`);
    }

    if (!verifyUnsubscribeToken(email, token)) {
        return NextResponse.redirect(`${base}/unsubscribe?error=invalid`);
    }

    try {
        const supabase = await getSupabase();
        await supabase
            .from('rider_unsubscribes')
            .upsert({ email }, { onConflict: 'email' });

        return NextResponse.redirect(`${base}/unsubscribe?success=1&email=${encodeURIComponent(email)}`);
    } catch (err) {
        console.error('Unsubscribe error:', err);
        return NextResponse.redirect(`${base}/unsubscribe?error=server`);
    }
}

// One-click unsubscribe — Gmail calls this automatically via List-Unsubscribe-Post header
export async function POST(request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.toLowerCase().trim();
    const token = searchParams.get('token');

    if (!email || !token || !verifyUnsubscribeToken(email, token)) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    try {
        const supabase = await getSupabase();
        await supabase
            .from('rider_unsubscribes')
            .upsert({ email }, { onConflict: 'email' });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('One-click unsubscribe error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
