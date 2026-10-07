DROP POLICY IF EXISTS score_insert_participant ON public.compatibility_scores;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.compatibility_scores FROM authenticated, anon;
GRANT SELECT ON public.compatibility_scores TO authenticated;
GRANT ALL ON public.compatibility_scores TO service_role;
ALTER TABLE public.compatibility_scores
  ADD CONSTRAINT compatibility_score_range CHECK (score BETWEEN 0 AND 100) NOT VALID;

CREATE TABLE IF NOT EXISTS public.compatibility_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.compatibility_requests TO service_role;
ALTER TABLE public.compatibility_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS compatibility_requests_user_time ON public.compatibility_requests (user_id, created_at DESC);
COMMENT ON TABLE public.compatibility_requests IS 'Journal serveur des calculs IA de compatibilité (limite anti-abus). Aucun accès client.';