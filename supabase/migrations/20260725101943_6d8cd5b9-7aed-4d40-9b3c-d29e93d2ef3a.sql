
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prompts jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until timestamptz;
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS is_super boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.compatibility_scores (
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  score int NOT NULL CHECK (score BETWEEN 0 AND 100),
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_a, user_b),
  CHECK (user_a < user_b)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compatibility_scores TO authenticated;
GRANT ALL ON public.compatibility_scores TO service_role;
ALTER TABLE public.compatibility_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "score_read_participant" ON public.compatibility_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "score_insert_participant" ON public.compatibility_scores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'premium',
  status text NOT NULL DEFAULT 'inactive',
  provider text,
  provider_ref text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_read_own" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER sub_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
