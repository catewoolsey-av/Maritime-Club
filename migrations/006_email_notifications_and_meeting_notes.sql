-- Add email_test_mode to site_settings (defaults to true for safety)
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS email_test_mode BOOLEAN DEFAULT true;

-- Add meeting notes fields to sessions table
-- attendees: array of member IDs who attended
-- participants: array of member IDs who actively participated/spoke
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]'::jsonb;

ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb;

-- Free text meeting notes
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS meeting_notes TEXT DEFAULT '';
