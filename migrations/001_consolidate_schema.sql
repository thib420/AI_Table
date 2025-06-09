-- Migration: Consolidate duplicate tables and standardize schema
-- Version: 001
-- Description: Remove duplicate tables and unify the data model

BEGIN;

-- Step 1: Migrate data from old tables to unified tables (if needed)
-- This assumes unified_* tables are the canonical ones

-- Migrate emails data if exists
INSERT INTO unified_emails (
  user_id, graph_message_id, folder_id, sender_name, sender_email, 
  subject, body_preview, received_date_time, is_read, is_flagged, 
  has_attachments, importance, web_link, raw_data, created_at, updated_at
)
SELECT 
  user_id::TEXT, graph_message_id, folder_id::TEXT, sender_name, sender_email,
  subject, body_preview, received_date_time, is_read, is_flagged,
  has_attachments, importance, web_link, raw_message_data, created_at, updated_at
FROM emails e
WHERE NOT EXISTS (
  SELECT 1 FROM unified_emails ue 
  WHERE ue.graph_message_id = e.graph_message_id 
  AND ue.user_id = e.user_id::TEXT
)
ON CONFLICT (user_id, graph_message_id) DO NOTHING;

-- Migrate folders data if exists
INSERT INTO unified_folders (
  user_id, graph_folder_id, display_name, unread_count, total_count,
  folder_type, is_system_folder, created_at, updated_at
)
SELECT 
  user_id::TEXT, graph_folder_id, display_name, unread_count, total_count,
  COALESCE(folder_type, 'custom'), is_system_folder, created_at, updated_at
FROM email_folders ef
WHERE NOT EXISTS (
  SELECT 1 FROM unified_folders uf 
  WHERE uf.graph_folder_id = ef.graph_folder_id 
  AND uf.user_id = ef.user_id::TEXT
)
ON CONFLICT (user_id, graph_folder_id) DO NOTHING;

-- Step 2: Drop old tables
DROP TABLE IF EXISTS email_sync_status CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS email_folders CASCADE;

-- Step 3: Rename unified tables to canonical names
ALTER TABLE unified_emails RENAME TO emails;
ALTER TABLE unified_folders RENAME TO folders;
ALTER TABLE unified_contacts RENAME TO contacts;
ALTER TABLE unified_meetings RENAME TO meetings;
ALTER TABLE unified_sync_status RENAME TO user_data_sync;

-- Step 4: Standardize column types and constraints
-- Ensure all user_id columns are TEXT (some were UUID)
-- Note: unified_contacts already uses TEXT for user_id

-- Step 5: Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_graph_message_id ON emails(graph_message_id);
CREATE INDEX IF NOT EXISTS idx_emails_received_date ON emails(received_date_time DESC);
CREATE INDEX IF NOT EXISTS idx_emails_user_folder ON emails(user_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_graph_contact_id ON contacts(graph_contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_email ON contacts(user_id, email);

CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_graph_event_id ON meetings(graph_event_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_graph_folder_id ON folders(graph_folder_id);

-- Step 6: Add unique constraints to prevent duplicates
ALTER TABLE emails 
  ADD CONSTRAINT unique_emails_user_graph_id 
  UNIQUE (user_id, graph_message_id);

ALTER TABLE contacts 
  ADD CONSTRAINT unique_contacts_user_graph_id 
  UNIQUE (user_id, graph_contact_id);

ALTER TABLE meetings 
  ADD CONSTRAINT unique_meetings_user_graph_id 
  UNIQUE (user_id, graph_event_id);

ALTER TABLE folders 
  ADD CONSTRAINT unique_folders_user_graph_id 
  UNIQUE (user_id, graph_folder_id);

-- Step 7: Add helpful comments
COMMENT ON TABLE emails IS 'Cached email messages from Microsoft Graph';
COMMENT ON TABLE contacts IS 'Cached contacts from Microsoft Graph (contacts, people, users)';
COMMENT ON TABLE meetings IS 'Cached calendar events from Microsoft Graph';
COMMENT ON TABLE folders IS 'Cached mail folders from Microsoft Graph';
COMMENT ON TABLE user_data_sync IS 'Tracks sync status for each user';

-- Step 8: Update RLS policies if needed
-- Enable RLS on all tables
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_sync ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth setup)
-- These assume user_id matches auth.users.id as TEXT

-- Emails policies
DROP POLICY IF EXISTS "Users can access their own emails" ON emails;
CREATE POLICY "Users can access their own emails" ON emails
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Contacts policies  
DROP POLICY IF EXISTS "Users can access their own contacts" ON contacts;
CREATE POLICY "Users can access their own contacts" ON contacts
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Meetings policies
DROP POLICY IF EXISTS "Users can access their own meetings" ON meetings;
CREATE POLICY "Users can access their own meetings" ON meetings
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Folders policies
DROP POLICY IF EXISTS "Users can access their own folders" ON folders;
CREATE POLICY "Users can access their own folders" ON folders
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Sync status policies
DROP POLICY IF EXISTS "Users can access their own sync status" ON user_data_sync;
CREATE POLICY "Users can access their own sync status" ON user_data_sync
  FOR ALL USING (user_id = auth.uid()::TEXT);

-- Step 9: Create helpful views for common queries
CREATE OR REPLACE VIEW user_email_stats AS
SELECT 
  user_id,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE is_read = false) as unread_emails,
  COUNT(*) FILTER (WHERE is_flagged = true) as flagged_emails,
  MAX(received_date_time) as latest_email,
  MIN(received_date_time) as oldest_email
FROM emails
GROUP BY user_id;

CREATE OR REPLACE VIEW user_contact_stats AS
SELECT 
  user_id,
  COUNT(*) as total_contacts,
  COUNT(DISTINCT company) as unique_companies,
  COUNT(*) FILTER (WHERE source = 'contacts') as graph_contacts,
  COUNT(*) FILTER (WHERE source = 'people') as graph_people,
  COUNT(*) FILTER (WHERE source = 'users') as graph_users,
  COUNT(*) FILTER (WHERE source = 'emails') as email_contacts
FROM contacts
WHERE company IS NOT NULL AND company != ''
GROUP BY user_id;

COMMIT; 