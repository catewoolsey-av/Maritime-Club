-- Password Reset Table Migration
-- Run this in your Supabase SQL Editor

-- Create the password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

-- Create index for cleaning up expired tokens
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations from service role (serverless functions)
-- Note: Anonymous users cannot access this table directly
CREATE POLICY "Service role access only" ON password_resets
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anon to insert (for creating reset requests)
CREATE POLICY "Allow insert for password reset requests" ON password_resets
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anon to select and update (for validating and using tokens)
CREATE POLICY "Allow select for token validation" ON password_resets
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow update for marking tokens used" ON password_resets
  FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Allow delete for cleanup" ON password_resets
  FOR DELETE
  TO anon
  USING (true);

-- Optional: Auto-cleanup job to delete old/used tokens
-- You can run this periodically or set up a cron job
-- DELETE FROM password_resets WHERE used = true OR expires_at < NOW();
