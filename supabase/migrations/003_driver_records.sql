-- =========================================
-- Driver Records & Groups Schema
-- For managing driver data from Excel uploads
-- =========================================

-- Driver Records (from Excel uploads)
CREATE TABLE IF NOT EXISTS driver_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT NOT NULL,
  driving_license_number TEXT,
  license_class TEXT,
  address TEXT,
  
  -- Approval Status
  sgi_approved BOOLEAN DEFAULT FALSE,
  spinr_approved BOOLEAN DEFAULT FALSE,
  
  -- Vehicle Information
  vehicle_plate TEXT,
  vin TEXT,
  vehicle_type TEXT,
  car_year INT,
  car_make TEXT,
  car_model TEXT,
  
  -- Document Expiry Dates
  criminal_record_check_expiry DATE,
  car_insurance_expiry DATE,
  vehicle_inspection_expiry DATE,
  drivers_abstract_status TEXT,
  work_authorization_expiry DATE,
  
  -- Immigration Status
  is_pr BOOLEAN DEFAULT FALSE,
  is_citizen BOOLEAN DEFAULT FALSE,
  
  -- Other
  profile_complete BOOLEAN DEFAULT FALSE,
  decals_sent BOOLEAN DEFAULT FALSE,
  
  -- Training Status (linked to LMS)
  lms_user_id UUID REFERENCES lms_users(id) ON DELETE SET NULL,
  training_status TEXT DEFAULT 'not_invited' CHECK (training_status IN ('not_invited', 'invited', 'registered', 'in_progress', 'completed')),
  training_completed_at TIMESTAMPTZ,
  last_reminder_sent_at TIMESTAMPTZ,
  reminder_count INT DEFAULT 0,
  
  -- Location/City (from Excel sheet name)
  city TEXT,
  
  -- Metadata
  source_file TEXT,
  source_sheet TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint on email to prevent duplicates
  UNIQUE(email)
);

-- Driver Groups for communication
CREATE TABLE IF NOT EXISTS driver_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  filter_criteria JSONB, -- Stores the filter rules for dynamic grouping
  is_system_group BOOLEAN DEFAULT FALSE, -- System groups cannot be deleted
  created_by UUID REFERENCES lms_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual group membership (for custom groups)
CREATE TABLE IF NOT EXISTS driver_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES driver_groups(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES driver_records(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, driver_id)
);

-- Communication Log (tracks all emails/SMS sent to drivers)
CREATE TABLE IF NOT EXISTS driver_communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES driver_records(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms')),
  message_type TEXT NOT NULL, -- 'invite', 'reminder', 'custom'
  subject TEXT,
  message_body TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'bounced')),
  external_id TEXT, -- Resend/Twilio message ID
  error_message TEXT,
  sent_by UUID REFERENCES lms_users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Excel Upload History
CREATE TABLE IF NOT EXISTS driver_upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  sheet_name TEXT,
  total_records INT DEFAULT 0,
  new_records INT DEFAULT 0,
  updated_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  errors JSONB,
  uploaded_by UUID REFERENCES lms_users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_records_email ON driver_records(email);
CREATE INDEX IF NOT EXISTS idx_driver_records_phone ON driver_records(phone);
CREATE INDEX IF NOT EXISTS idx_driver_records_spinr_approved ON driver_records(spinr_approved);
CREATE INDEX IF NOT EXISTS idx_driver_records_training_status ON driver_records(training_status);
CREATE INDEX IF NOT EXISTS idx_driver_records_lms_user ON driver_records(lms_user_id);
CREATE INDEX IF NOT EXISTS idx_driver_records_city ON driver_records(city);
CREATE INDEX IF NOT EXISTS idx_driver_comm_log_driver ON driver_communication_log(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_comm_log_type ON driver_communication_log(communication_type, message_type);
CREATE INDEX IF NOT EXISTS idx_driver_group_members_group ON driver_group_members(group_id);

-- Enable RLS
ALTER TABLE driver_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_upload_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only access
CREATE POLICY "Admins can manage driver records" ON driver_records FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

CREATE POLICY "Admins can manage driver groups" ON driver_groups FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

CREATE POLICY "Admins can manage group members" ON driver_group_members FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

CREATE POLICY "Admins can view communication log" ON driver_communication_log FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

CREATE POLICY "Admins can view upload history" ON driver_upload_history FOR ALL USING (
  EXISTS (SELECT 1 FROM lms_users WHERE id = (select auth.uid()) AND role = 'admin')
);

-- Insert system groups (dynamic groups based on training status)
INSERT INTO driver_groups (name, description, filter_criteria, is_system_group) VALUES
  ('All Spinr Approved', 'All drivers who are Spinr approved and eligible for training', '{"spinr_approved": true}', true),
  ('Training Completed', 'Drivers who have completed their training', '{"spinr_approved": true, "training_status": "completed"}', true),
  ('Registered Not Completed', 'Drivers who registered but have not completed training', '{"spinr_approved": true, "training_status": ["registered", "in_progress"]}', true),
  ('Not Registered', 'Spinr approved drivers who have not registered for training', '{"spinr_approved": true, "training_status": ["not_invited", "invited"]}', true),
  ('Needs Reminder', 'Drivers who need training reminders (not completed)', '{"spinr_approved": true, "training_status": ["invited", "registered", "in_progress"]}', true)
ON CONFLICT (name) DO NOTHING;

-- Function to sync driver training status with LMS
CREATE OR REPLACE FUNCTION sync_driver_training_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When an enrollment is completed, update the driver record
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE driver_records
    SET 
      training_status = 'completed',
      training_completed_at = NOW(),
      updated_at = NOW()
    WHERE lms_user_id = NEW.user_id;
  END IF;
  
  -- When enrollment status changes to in_progress
  IF NEW.status = 'in_progress' AND (OLD IS NULL OR OLD.status != 'in_progress') THEN
    UPDATE driver_records
    SET 
      training_status = 'in_progress',
      updated_at = NOW()
    WHERE lms_user_id = NEW.user_id AND training_status != 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update driver status when enrollment changes
DROP TRIGGER IF EXISTS trigger_sync_driver_training ON enrollments;
CREATE TRIGGER trigger_sync_driver_training
AFTER INSERT OR UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION sync_driver_training_status();

-- Function to link driver record when LMS user is created
CREATE OR REPLACE FUNCTION link_driver_to_lms_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to link driver record by email
  UPDATE driver_records
  SET 
    lms_user_id = NEW.id,
    training_status = 'registered',
    updated_at = NOW()
  WHERE LOWER(email) = LOWER(NEW.email) AND lms_user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link driver when user registers
DROP TRIGGER IF EXISTS trigger_link_driver_lms ON lms_users;
CREATE TRIGGER trigger_link_driver_lms
AFTER INSERT ON lms_users
FOR EACH ROW
EXECUTE FUNCTION link_driver_to_lms_user();
