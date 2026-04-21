-- Migration: Add visibility toggle for AV team members
-- This allows admins to control which AV team members are visible to members

-- Add is_visible_to_members column to av_team table
ALTER TABLE av_team
ADD COLUMN IF NOT EXISTS is_visible_to_members BOOLEAN DEFAULT FALSE;

-- Set initial visible members (Drew, Tuleka, Mike, Ludwig)
-- Run this after adding the column, update the names to match exactly what's in your database
UPDATE av_team
SET is_visible_to_members = TRUE
WHERE full_name ILIKE '%Drew%'
   OR full_name ILIKE '%Tuleka%'
   OR full_name ILIKE '%Mike%'
   OR full_name ILIKE '%Ludwig%';
