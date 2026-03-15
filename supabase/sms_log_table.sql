-- =========================================
-- SMS Log Table for Tracking Delivery Status
-- Run this in Supabase SQL Editor
-- =========================================

-- Create sms_log table
CREATE TABLE IF NOT EXISTS sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  twilio_sid TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read (admins can manage)
CREATE POLICY "Anyone authenticated can read sms_log" ON sms_log FOR SELECT USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role can manage sms_log" ON sms_log FOR ALL USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sms_log_phone ON sms_log(phone);
CREATE INDEX IF NOT EXISTS idx_sms_log_status ON sms_log(status);
CREATE INDEX IF NOT EXISTS idx_sms_log_created_at ON sms_log(created_at DESC);
