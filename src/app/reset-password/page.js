'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    // The code exchange happens server-side in /auth/callback, which establishes
    // a recovery session via cookies. Here we just verify that session exists.
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    toast.error('Your reset link is invalid or has expired. Please request a new one.');
                    router.push('/forgot-password');
                    return;
                }
                setSessionReady(true);
            } catch (err) {
                toast.error('Failed to validate reset link');
                router.push('/forgot-password');
            } finally {
                setIsChecking(false);
            }
        };

        checkSession();
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            // Sign out all sessions after password change for security
            await supabase.auth.signOut();

            setDone(true);
            toast.success('Password updated successfully! Please sign in with your new password.');

            // Redirect to login after short delay
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (error) {
            toast.error(error.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen flex flex-col bg-[hsl(var(--secondary))]">
                <div className="p-4 sm:p-6">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <Image src="/logo.png" alt="Spinr" width={100} height={33} className="h-9 w-auto" priority />
                    </Link>
                </div>
                <div className="flex-1 flex items-center justify-center px-4 pb-8">
                    <div className="text-center">
                        <div className="animate-pulse text-[hsl(var(--primary))] text-lg">Validating reset link...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!sessionReady) {
        return null;
    }

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
                            <h1 className="text-2xl font-bold">{done ? 'Password Updated!' : 'Set New Password'}</h1>
                            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">
                                {done ? 'Redirecting to sign in...' : 'Enter your new password below.'}
                            </p>
                        </div>

                        {!done ? (
                            <form onSubmit={handleReset} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 6 characters"
                                            required
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-base touch-target"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] touch-target flex items-center justify-center"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat your password"
                                        required
                                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-base touch-target"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[hsl(var(--primary))] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 touch-target text-base"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-4">
                                <div className="animate-pulse text-[hsl(var(--primary))]">Redirecting...</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
