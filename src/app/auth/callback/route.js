import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const next = searchParams.get('next') ?? '/dashboard';
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    // Handle recovery link errors (expired/invalid token)
    if (errorCode || errorDescription) {
        const errorMsg = errorDescription || 'The password reset link is invalid or has expired. Please request a new one.';
        return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent(errorMsg)}`);
    }

    if (code) {
        const { createClient } = await import('@/lib/supabase-server');
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if this is a password recovery flow via:
            // 1. The `type` query param (not always present)
            // 2. The session's AMR (authentication methods reference) — most reliable
            const isRecovery =
                type === 'recovery' ||
                request.url.includes('recovery') ||
                data?.session?.amr?.some((entry) => entry.method === 'recovery');

            if (isRecovery) {
                return NextResponse.redirect(`${origin}/reset-password`);
            }
            return NextResponse.redirect(`${origin}${next}`);
        }

        // Handle specific exchange errors
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
            return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent('This password reset link has expired. Please request a new one.')}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
