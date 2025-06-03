-- Migration: Persistent Unified Data Tables
-- This migration creates tables for storing Microsoft Graph data persistently
-- Allows for incremental sync and faster app startup

-- Create unified sync status table
CREATE TABLE IF NOT EXISTS unified_sync_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  last_emails_sync TIMESTAMPTZ,
  last_contacts_sync TIMESTAMPTZ,
  last_meetings_sync TIMESTAMPTZ,
  last_folders_sync TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unified emails table
CREATE TABLE IF NOT EXISTS unified_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  graph_message_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  subject TEXT,
  body_preview TEXT,
  received_date_time TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  importance TEXT DEFAULT 'normal',
  web_link TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(user_id, graph_message_id)
);

-- Create unified contacts table
CREATE TABLE IF NOT EXISTS unified_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  graph_contact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  position TEXT,
  location TEXT,
  source TEXT NOT NULL CHECK (source IN ('contacts', 'people', 'users', 'emails')),
  graph_type TEXT NOT NULL CHECK (graph_type IN ('contact', 'person', 'user')),
  last_interaction TIMESTAMPTZ,
  interaction_count INTEGER DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(user_id, graph_contact_id)
);

-- Create unified meetings table
CREATE TABLE IF NOT EXISTS unified_meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  graph_event_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  attendees JSONB DEFAULT '[]',
  organizer_email TEXT,
  location TEXT,
  is_online_meeting BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(user_id, graph_event_id)
);

-- Create unified folders table
CREATE TABLE IF NOT EXISTS unified_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  graph_folder_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  unread_count INTEGER DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  folder_type TEXT NOT NULL,
  is_system_folder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(user_id, graph_folder_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_unified_emails_user_id ON unified_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_emails_received_date ON unified_emails(received_date_time DESC);
CREATE INDEX IF NOT EXISTS idx_unified_emails_folder_id ON unified_emails(folder_id);
CREATE INDEX IF NOT EXISTS idx_unified_emails_sender_email ON unified_emails(sender_email);
CREATE INDEX IF NOT EXISTS idx_unified_emails_is_read ON unified_emails(is_read);
CREATE INDEX IF NOT EXISTS idx_unified_emails_is_flagged ON unified_emails(is_flagged);

CREATE INDEX IF NOT EXISTS idx_unified_contacts_user_id ON unified_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_contacts_email ON unified_contacts(email);
CREATE INDEX IF NOT EXISTS idx_unified_contacts_name ON unified_contacts(name);
CREATE INDEX IF NOT EXISTS idx_unified_contacts_company ON unified_contacts(company);
CREATE INDEX IF NOT EXISTS idx_unified_contacts_source ON unified_contacts(source);
CREATE INDEX IF NOT EXISTS idx_unified_contacts_graph_type ON unified_contacts(graph_type);

CREATE INDEX IF NOT EXISTS idx_unified_meetings_user_id ON unified_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_meetings_start_time ON unified_meetings(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_unified_meetings_organizer_email ON unified_meetings(organizer_email);

CREATE INDEX IF NOT EXISTS idx_unified_folders_user_id ON unified_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_unified_folders_type ON unified_folders(folder_type);
CREATE INDEX IF NOT EXISTS idx_unified_folders_system ON unified_folders(is_system_folder);

-- Enable Row Level Security (RLS)
ALTER TABLE unified_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation
CREATE POLICY "Users can access own sync status" ON unified_sync_status
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can access own emails" ON unified_emails
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can access own contacts" ON unified_contacts
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can access own meetings" ON unified_meetings
  FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY "Users can access own folders" ON unified_folders
  FOR ALL USING (user_id = auth.uid()::text);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_unified_sync_status_updated_at 
  BEFORE UPDATE ON unified_sync_status 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_emails_updated_at 
  BEFORE UPDATE ON unified_emails 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_contacts_updated_at 
  BEFORE UPDATE ON unified_contacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_meetings_updated_at 
  BEFORE UPDATE ON unified_meetings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_folders_updated_at 
  BEFORE UPDATE ON unified_folders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for easier querying
CREATE OR REPLACE VIEW user_email_stats AS
SELECT 
  user_id,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE is_read = false) as unread_emails,
  COUNT(*) FILTER (WHERE is_flagged = true) as flagged_emails,
  COUNT(*) FILTER (WHERE has_attachments = true) as emails_with_attachments,
  MAX(received_date_time) as latest_email_date,
  MIN(received_date_time) as earliest_email_date
FROM unified_emails 
GROUP BY user_id;

CREATE OR REPLACE VIEW user_contact_stats AS
SELECT 
  user_id,
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE source = 'contacts') as outlook_contacts,
  COUNT(*) FILTER (WHERE source = 'people') as org_people,
  COUNT(*) FILTER (WHERE source = 'users') as org_users,
  COUNT(*) FILTER (WHERE source = 'emails') as email_contacts,
  COUNT(DISTINCT company) FILTER (WHERE company IS NOT NULL) as unique_companies
FROM unified_contacts 
GROUP BY user_id;

CREATE OR REPLACE VIEW user_meeting_stats AS
SELECT 
  user_id,
  COUNT(*) as total_meetings,
  COUNT(*) FILTER (WHERE is_online_meeting = true) as online_meetings,
  COUNT(*) FILTER (WHERE start_time > NOW()) as upcoming_meetings,
  COUNT(*) FILTER (WHERE start_time < NOW()) as past_meetings,
  MAX(start_time) as latest_meeting_date,
  MIN(start_time) as earliest_meeting_date
FROM unified_meetings 
GROUP BY user_id;

-- Grant permissions (adjust based on your authentication setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 