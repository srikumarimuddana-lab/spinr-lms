-- =====================================================
-- Spinr LMS - Rider Unsubscribes Migration
-- Run this in Supabase SQL Editor at https://app.supabase.com
-- =====================================================

CREATE TABLE IF NOT EXISTS rider_unsubscribes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    unsubscribed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup by email before every send
CREATE INDEX IF NOT EXISTS idx_rider_unsubscribes_email
    ON rider_unsubscribes (LOWER(email));

-- Allow public read for the API route (no auth needed to check/insert)
ALTER TABLE rider_unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
    ON rider_unsubscribes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
-- Migration doen fors subscribe thing  
