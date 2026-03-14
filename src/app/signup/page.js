'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (!agreed) {
            toast.error('Please accept the terms');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;

            // Create lms_users record via API
            if (data.user) {
                await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: data.user.id, email, fullName }),
                });
            }

            toast.success('Account created! Check your email to verify.');
            router.push('/login');
        } catch (error) {
            toast.error(error.message || 'Failed to create account');
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
                                <UserPlus className="w-7 h-7 text-[hsl(var(--primary))]" />
                            </div>
                            <h1 className="text-2xl font-bold">Create Account</h1>
                            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Start your driver training journey</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-base touch-target"
                                />
                            </div>

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

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Password</label>
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

                            <label className="flex items-start gap-3 cursor-pointer py-1">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-0.5 w-5 h-5 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                                />
                                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                    I agree to the Spinr driver training terms and conditions
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[hsl(var(--primary))] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 touch-target text-base"
                            >
                                {loading ? 'Creating account...' : 'Create Account'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
                            Already have an account?{' '}
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
