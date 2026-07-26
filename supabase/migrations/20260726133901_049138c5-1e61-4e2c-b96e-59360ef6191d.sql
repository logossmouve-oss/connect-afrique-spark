ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen timestamptz,
ADD COLUMN IF NOT EXISTS discover_country text,
ADD COLUMN IF NOT EXISTS discover_city text;

ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read_at timestamptz;