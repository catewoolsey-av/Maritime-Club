-- LinkedIn OAuth profile enrichment
-- Tracks whether a member has connected their LinkedIn account
-- and stores the verified data from LinkedIn's official API

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS linkedin_connected boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS linkedin_sub text,
ADD COLUMN IF NOT EXISTS linkedin_photo_url text,
ADD COLUMN IF NOT EXISTS linkedin_name text,
ADD COLUMN IF NOT EXISTS linkedin_connected_at timestamptz;
