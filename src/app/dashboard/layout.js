'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, BookOpen, Award, User, LogOut, Menu, X, Shield } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const [user, setUser] = useState(null);
    const [lmsUser, setLmsUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                let { data } = await supabase.from('lms_users').select('*').eq('id', user.id).maybeSingle();
                // Auto-create lms_users record if missing
                if (!data) {
                    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Driver';
                    await supabase.from('lms_users').insert({ id: user.id, email: user.email, full_name: name, role: 'driver' });
                    const { data: newData } = await supabase.from('lms_users').select('*').eq('id', user.id).maybeSingle();
                    data = newData;
                }
                setLmsUser(data);

                // Audit: log login
                fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'driver_login',
                        entityType: 'user',
                        entityId: user.id,
                        details: { driver_name: data?.full_name, email: user.email },
                    }),
                }).catch(() => { });
            }
        }
        loadUser();
    }, []);

    const handleLogout = async () => {
        // Audit: log logout
        if (user) {
            await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'driver_logout',
                    entityType: 'user',
                    entityId: user.id,
                    details: { driver_name: lmsUser?.full_name, email: user.email },
                }),
            }).catch(() => { });
        }
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Courses', href: '/dashboard/courses', icon: BookOpen },
        { name: 'Certificates', href: '/dashboard/certificates', icon: Award },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
    ];

    const isActive = (href) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

    return (
        <div className="min-h-screen bg-[hsl(var(--secondary))] flex flex-col">
            {/* Top Header */}
            <header className="bg-white border-b border-[hsl(var(--border))] sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden text-[hsl(var(--muted-foreground))] touch-target flex items-center justify-center"
                        >
                            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <Image src="/logo.png" alt="Spinr" width={90} height={30} className="h-8 w-auto" />
                            <span className="hidden sm:inline text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] px-2 py-0.5 rounded-full">Training</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        {lmsUser?.role === 'admin' && (
                            <Link href="/admin" className="text-xs font-medium text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--primary))]/10 transition-colors flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" /> Admin
                            </Link>
                        )}
                        <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {lmsUser?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-[hsl(var(--border))] sticky top-14 h-[calc(100vh-3.5rem)]">
                    <nav className="flex-1 p-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="p-3 border-t border-[hsl(var(--border))]">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-600 transition-colors w-full"
                        >
                            <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
                        <aside className="fixed top-14 left-0 bottom-0 w-64 bg-white z-30 lg:hidden shadow-xl">
                            <nav className="p-3 space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors touch-target ${isActive(item.href)
                                                ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                                                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="p-3 border-t border-[hsl(var(--border))]">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full touch-target"
                                >
                                    <LogOut className="w-5 h-5" /> Sign Out
                                </button>
                            </div>
                        </aside>
                    </>
                )}

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[hsl(var(--border))] z-40 safe-area-bottom">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full touch-target transition-colors ${isActive(item.href)
                                    ? 'text-[hsl(var(--primary))]'
                                    : 'text-[hsl(var(--muted-foreground))]'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
