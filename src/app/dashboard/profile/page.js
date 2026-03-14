'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const [lmsUser, setLmsUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => { loadProfile(); }, []);

    async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('lms_users').select('*').eq('id', user.id).maybeSingle();
            setLmsUser(data);
            setFullName(data?.full_name || '');
        }
        setLoading(false);
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        const { error } = await supabase.from('lms_users').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', lmsUser.id);
        if (error) toast.error('Failed to update');
        else toast.success('Profile updated!');
        setSaving(false);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-xl sm:text-2xl font-bold">Profile</h1>

            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="font-semibold text-lg">{lmsUser?.full_name}</p>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{lmsUser?.email}</p>
                        <span className="inline-block mt-1 text-xs font-medium bg-[hsl(var(--secondary))] px-2 py-0.5 rounded-full capitalize">{lmsUser?.role}</span>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all text-base touch-target"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Email</label>
                        <input type="email" value={lmsUser?.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-gray-100 text-[hsl(var(--muted-foreground))] text-base cursor-not-allowed" />
                    </div>
                    <button type="submit" disabled={saving} className="w-full bg-[hsl(var(--primary))] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 touch-target text-base">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>

            <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-medium hover:bg-red-50 transition-colors touch-target"
            >
                <LogOut className="w-5 h-5" /> Sign Out
            </button>
        </div>
    );
}
