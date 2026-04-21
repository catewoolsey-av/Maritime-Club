ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS google_calendar_link text;
