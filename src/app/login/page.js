'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            toast.success('Welcome back!');
            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            toast.error(error.message || 'Failed to sign in');
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
                                <LogIn className="w-7 h-7 text-[hsl(var(--primary))]" />
                            </div>
                            <h1 className="text-2xl font-bold">Welcome Back</h1>
                            <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">Sign in to continue your training</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
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
                                        placeholder="••••••••"
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

                            <div className="flex justify-end">
                                <Link href="/forgot-password" className="text-sm text-[hsl(var(--primary))] hover:underline">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[hsl(var(--primary))] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 touch-target text-base"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-[hsl(var(--primary))] font-medium hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
