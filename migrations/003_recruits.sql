-- Migration: Recruit Management System
-- Run this in Supabase SQL Editor

-- 1. Create recruits table
CREATE TABLE IF NOT EXISTS recruits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  bio TEXT,
  source TEXT CHECK (source IN ('personal_contact', 'av_syndication', 'events', 'irl_events', 'conferences', 'referral', 'other')),
  av_lead_id UUID REFERENCES av_team(id),
  av_lead_name TEXT,
  stage TEXT DEFAULT 'interested' CHECK (stage IN ('interested', 'sent_link', 'application', 'interviewed', 'accepted', 'onboarded', 'uploaded', 'attended')),
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_recruits_stage ON recruits(stage);
CREATE INDEX IF NOT EXISTS idx_recruits_av_lead ON recruits(av_lead_id);
CREATE INDEX IF NOT EXISTS idx_recruits_created_at ON recruits(created_at DESC);

-- 3. Enable RLS
ALTER TABLE recruits ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy
CREATE POLICY "Allow all access to recruits" ON recruits FOR ALL USING (true);

-- 5. Import existing recruits from spreadsheet
INSERT INTO recruits (name, email, phone, location, linkedin_url, bio, av_lead_name, stage, notes, source) VALUES
  ('Leon de Boer', 'leondeboer36@gmail.com', '+31637277156', 'Amsterdam', 'https://www.linkedin.com/in/leon-de-boer', NULL, 'Colin', 'interviewed', NULL, 'personal_contact'),
  ('Reese Collins', 'reesec1999@gmail.com', NULL, 'NYC', NULL, NULL, 'Mike Collins', 'interviewed', NULL, 'personal_contact'),
  ('Hanishka Gehani', 'hanishka@zabadani.ae', NULL, 'Dubai', NULL, 'Large Landowning family Dubai', 'Tuleeka', 'interviewed', 'Interviewed', 'personal_contact'),
  ('Antonia Alvarez', 'aauplaza@gmail.com', NULL, NULL, NULL, NULL, 'Tuleeka', 'interviewed', 'Scheduling', 'personal_contact'),
  ('Brayden DeWitt', 'dewittbrayden@gmail.com', NULL, 'New York', 'https://www.linkedin.com/in/braydendewitt', NULL, 'Greg', 'interviewed', NULL, 'personal_contact'),
  ('Julia Alvarez', NULL, NULL, NULL, NULL, 'Sister of Antonia', 'Tuleeka', 'application', NULL, 'personal_contact'),
  ('Anushka Jain', NULL, NULL, 'US/India', 'https://www.linkedin.com/in/anushka-jain', NULL, 'Tuleeka', 'application', 'Scheduling', 'personal_contact'),
  ('Khalaf al Otaiba', NULL, '+971 56 331 8033', 'Abu Dhabi', 'https://alotaiba.ae/about-us/history', NULL, 'Tuleeka', 'sent_link', 'Sent 12/19 will f/u with Happy New Year', 'personal_contact'),
  ('Taha Lahbabi', 'taha@awa.vc', NULL, 'Paris/Dubai', 'https://www.linkedin.com/in/tahalahbabi', NULL, 'Tuleeka', 'sent_link', 'Sent 1/2 he said he will do this week', 'personal_contact'),
  ('Robin Devos', NULL, NULL, 'US', NULL, 'Family office board member, invests in VC', 'Tuleeka', 'sent_link', 'Has family IC 1/6', 'personal_contact'),
  ('Hanishka Gehani Brother', NULL, NULL, 'Dubai', NULL, 'Large Landowning family Dubai', 'Tuleeka', 'interested', 'Will check with Sister', 'personal_contact'),
  ('Cailin Gore', NULL, NULL, 'NYC', 'https://www.linkedin.com/in/cailingore/', NULL, 'Stephanie', 'application', 'Uncommittal on application', 'personal_contact'),
  ('Regan Gore', NULL, NULL, 'NYC', NULL, NULL, 'Stephanie', 'application', 'Uncommittal on application', 'personal_contact'),
  ('Jacobs Bros.', NULL, NULL, 'Chicago', NULL, 'Car Dealerships', 'David', 'interested', 'Mtg Linda Jacobs in Early January', 'personal_contact'),
  ('Marshall Hess Son', NULL, NULL, 'Dallas', NULL, 'McGuire Oil - Son (23) and daughter (21) to join', 'David', 'interested', NULL, 'personal_contact'),
  ('Lucia Magot', NULL, NULL, 'Boston/Peru', NULL, 'Has prior experience investing in venture', 'Tuleeka', 'interested', 'Emailed and texted will follow up', 'personal_contact'),
  ('Samar Dhanani', NULL, NULL, 'Boston/Dubai', NULL, 'Billion dollar family largest franchisee', 'Tuleeka', 'sent_link', 'Call 1/2 sending info Monday', 'personal_contact'),
  ('Grace Jennings', NULL, NULL, 'Canada/Boston', 'https://linkedin.com/in/grace-jennings5', NULL, 'Tuleeka', 'interested', 'She asked for a call 1/17', 'personal_contact'),
  ('Grace Jennings Brother', NULL, NULL, 'Canada', NULL, NULL, 'Tuleeka', 'interested', NULL, 'personal_contact'),
  ('JJ Malfettone', NULL, NULL, NULL, 'https://www.linkedin.com/in/jj-malfettone', NULL, 'Stephanie', 'interested', 'Intro call 1/8', 'personal_contact');
