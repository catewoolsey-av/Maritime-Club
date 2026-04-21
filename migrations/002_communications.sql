-- Migration: Communications/Announcements System
-- Run this in Supabase SQL Editor

-- 1. Add preferred contact method to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS preferred_contact TEXT DEFAULT 'email' 
CHECK (preferred_contact IN ('email', 'sms', 'whatsapp', 'all'));

-- 2. Create announcement templates table
CREATE TABLE IF NOT EXISTS announcement_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT DEFAULT 'custom' CHECK (template_type IN ('deal_alert', 'session_reminder', 'general', 'custom')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create announcements table (sent communications log)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  channels TEXT[] DEFAULT ARRAY['email'], -- ['email', 'sms']
  sent_by UUID REFERENCES av_team(id),
  sent_by_name TEXT,
  recipient_count INTEGER DEFAULT 0,
  filter_used TEXT, -- JSON string of filters applied
  status TEXT DEFAULT 'sent' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create announcement recipients table (delivery tracking)
CREATE TABLE IF NOT EXISTS announcement_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_sent_by ON announcements(sent_by);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_announcement ON announcement_recipients(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_member ON announcement_recipients(member_id);
CREATE INDEX IF NOT EXISTS idx_announcement_recipients_status ON announcement_recipients(status);

-- 6. Insert default templates
INSERT INTO announcement_templates (name, subject, body, template_type) VALUES
  ('New Deal Alert', 'New Investment Opportunity: {{company_name}}', 
   E'Hi {{member_name}},\n\nWe have a new investment opportunity for your review:\n\n**{{company_name}}**\n{{deal_headline}}\n\nSector: {{sector}}\nStage: {{stage}}\nRaise: {{raise_amount}}\n\nDeadline: {{deadline}}\n\nLog in to review the full deal memo and submit your vote.\n\nBest,\nAV NextGen Team',
   'deal_alert'),
  
  ('Session Reminder', 'Reminder: {{session_title}} - {{session_date}}',
   E'Hi {{member_name}},\n\nThis is a reminder about our upcoming session:\n\n**{{session_title}}**\nDate: {{session_date}}\nTime: {{session_time}}\n\n{{session_description}}\n\nJoin link: {{zoom_link}}\n\nSee you there!\n\nAV NextGen Team',
   'session_reminder'),
  
  ('General Announcement', '{{subject}}',
   E'Hi {{member_name}},\n\n{{body}}\n\nBest,\nAV NextGen Team',
   'general')
ON CONFLICT DO NOTHING;

-- 7. Enable RLS
ALTER TABLE announcement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies (allow authenticated access for admin operations)
CREATE POLICY "Allow all access to announcement_templates" ON announcement_templates FOR ALL USING (true);
CREATE POLICY "Allow all access to announcements" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all access to announcement_recipients" ON announcement_recipients FOR ALL USING (true);

-- 9. Create storage bucket for attachments (run separately in Supabase Dashboard > Storage)
-- Bucket name: announcement-attachments
-- Max file size: 25MB
-- Allowed types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

