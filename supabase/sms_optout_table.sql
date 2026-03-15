-- =========================================
-- SMS Opt-Out Table for Compliance (TCPA/CRTC)
-- Run this in Supabase SQL Editor
-- =========================================

-- Create sms_optout table to track users who opted out of SMS
CREATE TABLE IF NOT EXISTS sms_optout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  optout_method TEXT DEFAULT 'sms_stop' CHECK (optout_method IN ('sms_stop', 'sms_unsubscribe', 'manual', 'admin')),
  -- Track if user re-opts in
  reopted_in_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sms_optout ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read (for checking before sending)
CREATE POLICY "Anyone authenticated can read sms_optout" ON sms_optout FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage sms_optout" ON sms_optout FOR ALL USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_optout_phone ON sms_optout(phone);
CREATE INDEX IF NOT EXISTS idx_sms_optout_is_active ON sms_optout(is_active) WHERE is_active = TRUE;

-- =========================================
-- Add optout_status column to sms_log for tracking
-- =========================================
ALTER TABLE sms_log ADD COLUMN IF NOT EXISTS optout_at TIMESTAMPTZ;
ALTER TABLE sms_log ADD COLUMN IF NOT EXISTS processed_as VARCHAR(50);

-- Create index for tracking processed messages
CREATE INDEX IF NOT EXISTS idx_sms_log_processed_as ON sms_log(processed_as);
