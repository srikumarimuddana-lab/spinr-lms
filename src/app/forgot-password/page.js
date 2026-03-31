'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [origin, setOrigin] = useState('');
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Get origin client-side to avoid SSR issues
    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    // Handle error from callback redirect
    useEffect(() => {
        const error = searchParams.get('error');
        if (error) {
            toast.error(decodeURIComponent(error));
        }
    }, [searchParams]);

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${origin}/auth/callback`,
            });
            if (error) throw error;
            setSent(true);
            toast.success('Password reset link sent!');
        } catch (error) {
            toast.error(error.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-[hsl(var(--secondary))]">
            <div className="p-4 sm:p-6">
                <Link href="/" className="inline-flex items-center gap-2">
                    <Image src="/logo.png" alt="Spinr" width={100} height={33} className="h-9 w-auto" priority />
                </Link>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 pb-8">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-[hsl(var(--primary))]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="w-7 h-7 text-[hsl(var(--primary))]" />
                            </div>
                            <h1 className="text-2xl font-bold">Reset Password</h1>
                            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                                {sent ? 'Check your email for a reset link' : 'Enter your email to receive a reset link'}
                            </p>
                        </div>

                        {!sent ? (
                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@gmail.com"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-base touch-target"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[hsl(var(--primary))] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 touch-target text-base"
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-[hsl(var(--muted-foreground))] text-sm mb-4">
                                    We sent a reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
                                </p>
                                <button
                                    onClick={() => { setSent(false); setEmail(''); }}
                                    className="text-sm text-[hsl(var(--primary))] hover:underline"
                                >
                                    Try a different email
                                </button>
                            </div>
                        )}

                        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
                            Remember your password?{' '}
                            <Link href="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
