import { createBrowserClient } from '@supabase/ssr';

let client = null;

export function createClient() {
    if (client) return client;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // During build / SSG, env vars may be placeholders — return a no-op stub
    if (!url.startsWith('http')) {
        return {
            auth: {
                getUser: async () => ({ data: { user: null } }),
                signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
                signUp: async () => ({ data: { user: null }, error: { message: 'Supabase not configured' } }),
                signOut: async () => ({}),
                resetPasswordForEmail: async () => ({ error: { message: 'Supabase not configured' } }),
            },
            from: () => {
                const chain = {
                    select: () => chain, insert: () => chain, update: () => chain, delete: () => chain,
                    eq: () => chain, neq: () => chain, in: () => chain, order: () => chain, limit: () => chain,
                    single: () => Promise.resolve({ data: null, error: null }),
                    maybeSingle: () => Promise.resolve({ data: null, error: null }),
                    then: (resolve) => Promise.resolve({ data: null, error: null }).then(resolve),
                };
                return chain;
            },
        };
    }

    client = createBrowserClient(url, key);
    return client;
}
