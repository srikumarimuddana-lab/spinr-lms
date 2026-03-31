'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, BookOpen, Users, FileCheck, ArrowLeft, LogOut, Mail, MessageSquare, FileText } from 'lucide-react';

export default function AdminLayout({ children }) {
    const [lmsUser, setLmsUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        async function check() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }
            const { data } = await supabase.from('lms_users').select('*').eq('id', user.id).single();
            if (!data || data.role !== 'admin') { router.push('/dashboard'); return; }
            setLmsUser(data);
            setLoading(false);
        }
        check();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const nav = [
        { name: 'Overview', href: '/admin', icon: LayoutDashboard },
        { name: 'Courses', href: '/admin/courses', icon: BookOpen },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Compliance', href: '/admin/compliance', icon: FileCheck },
        { name: 'Email', href: '/admin/emails', icon: Mail },
        { name: 'Templates', href: '/admin/email-templates', icon: FileText },
        { name: 'SMS', href: '/admin/sms', icon: MessageSquare },
    ];

    const isActive = (href) => pathname === href || (href !== '/admin' && pathname.startsWith(href));

    return (
        <div className="min-h-screen bg-[hsl(var(--secondary))] flex flex-col">
            <header className="bg-white border-b border-[hsl(var(--border))] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="flex items-center gap-2">
                            <Image src="/logo.png" alt="Spinr" width={90} height={30} className="h-8 w-auto" />
                            <span className="text-xs font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-2 py-0.5 rounded-full">Admin</span>
                        </Link>
                    </div>
                    <Link href="/dashboard" className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1 touch-target">
                        <ArrowLeft className="w-3.5 h-3.5" /> Driver View
                    </Link>
                </div>
            </header>

            {/* Desktop: sidebar + content. Mobile: top tabs + content */}
            <div className="flex flex-1">
                {/* Desktop sidebar */}
                <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-[hsl(var(--border))] sticky top-14 h-[calc(100vh-3.5rem)]">
                    <nav className="flex-1 p-3 space-y-1">
                        {nav.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]'}`}>
                                    <Icon className="w-5 h-5" /> {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Mobile top tabs */}
                <div className="lg:hidden fixed top-14 left-0 right-0 bg-white border-b border-[hsl(var(--border))] z-30 overflow-x-auto">
                    <div className="flex">
                        {nav.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} href={item.href} className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${isActive(item.href) ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'border-transparent text-[hsl(var(--muted-foreground))]'}`}>
                                    <Icon className="w-4 h-4" /> {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-12 lg:mt-0 max-w-5xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
