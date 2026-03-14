import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        const { createClient } = await import('@/lib/supabase-server');
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // If this is a password recovery, redirect to reset-password page
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/reset-password`);
            }
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
