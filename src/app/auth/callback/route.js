import { NextResponse } from 'next/server';

/**
 * Validate and sanitize the 'next' redirect parameter to prevent open redirects
 * Only allows relative paths starting with '/'
 */
function getSafeRedirectPath(nextParam) {
    const defaultPath = '/dashboard';
    
    if (!nextParam || typeof nextParam !== 'string') {
        return defaultPath;
    }
    
    // Trim and get the path
    const path = nextParam.trim();
    
    // Must start with exactly one forward slash (not // which could be protocol-relative)
    if (!path.startsWith('/') || path.startsWith('//')) {
        return defaultPath;
    }
    
    // Block any attempts to include protocol or domain
    if (path.includes(':') || path.includes('\\')) {
        return defaultPath;
    }
    
    // Parse the path to ensure it's valid
    try {
        // Use URL parsing to validate - if it parses as a full URL, it's not safe
        const parsed = new URL(path, 'http://localhost');
        // Only return the pathname to strip any query strings that might be malicious
        return parsed.pathname;
    } catch {
        return defaultPath;
    }
}

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const next = getSafeRedirectPath(searchParams.get('next'));
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    // Handle recovery link errors (expired/invalid token)
    if (errorCode || errorDescription) {
        const errorMsg = errorDescription || 'The password reset link is invalid or has expired. Please request a new one.';
        return NextResponse.redirect(`${origin}/forgot-password?error=${encodeURIComponent(errorMsg)}`);
    }

    if (code) {
        const isRecovery = type === 'recovery' || request.url.includes('recovery');

        // Exchange the code server-side so the PKCE verifier cookie set by the browser
        // is available to complete the flow. Doing this on the client fails under strict
        // browser cookie policies or when the reset link opens a fresh tab/context.
        const { createClient } = await import('@/lib/supabase-server');
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            if (isRecovery) {
                return NextResponse.redirect(`${origin}/reset-password`);
            }
            return NextResponse.redirect(`${origin}${next}`);
        }

        const redirectBase = isRecovery ? '/forgot-password' : '/login';
        const message = error.message?.includes('expired') || error.message?.includes('invalid')
            ? 'This password reset link has expired or is invalid. Please request a new one.'
            : 'Could not validate this link. Please request a new one from the same browser you started from.';
        return NextResponse.redirect(`${origin}${redirectBase}?error=${encodeURIComponent(message)}`);
    }

    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
