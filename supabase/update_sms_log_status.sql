-- =========================================
-- Update sms_log table to support new statuses
-- Run this in Supabase SQL Editor
-- =========================================

-- Drop existing check constraint and recreate with new statuses
ALTER TABLE sms_log DROP CONSTRAINT IF EXISTS sms_log_status_check;

ALTER TABLE sms_log ADD CONSTRAINT sms_log_status_check 
CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'skipped', 'received'));

-- Add columns if they don't exist (for idempotency)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_log' AND column_name = 'optout_at') THEN
        ALTER TABLE sms_log ADD COLUMN optout_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sms_log' AND column_name = 'processed_as') THEN
        ALTER TABLE sms_log ADD COLUMN processed_as VARCHAR(50);
    END IF;
END $$;

-- Create index for tracking processed messages (if not exists)
CREATE INDEX IF NOT EXISTS idx_sms_log_processed_as ON sms_log(processed_as);
