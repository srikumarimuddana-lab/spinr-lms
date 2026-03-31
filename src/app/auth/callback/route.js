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
        // Check if this is a password recovery flow BEFORE exchanging the code
        const isRecovery = type === 'recovery' || request.url.includes('recovery');

        if (isRecovery) {
            // For recovery flows, redirect to reset-password page with the code
            // The reset-password page will handle the session exchange when user submits new password
            return NextResponse.redirect(`${origin}/reset-password?code=${code}`);
        }

        // For non-recovery flows (email verification, magic link, etc.), exchange code and redirect
        const { createClient } = await import('@/lib/supabase-server');
        const supabase = await createClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }

        // Handle specific exchange errors
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
            return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent('This password reset link has expired. Please request a new one.')}`);
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
