ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS mp_video_url text,
ADD COLUMN IF NOT EXISTS company_video_url text;
