CREATE OR REPLACE FUNCTION public.guard_profile_sensitive()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN RETURN NEW; END IF; -- service role / internal triggers
  IF TG_OP = 'INSERT' THEN
    NEW.monwe_code := public.generate_monwe_code();
    NEW.premium_until := NULL;
    NEW.onboarded := false;
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Modification de user_id interdite';
  END IF;
  IF NEW.monwe_code IS DISTINCT FROM OLD.monwe_code THEN
    RAISE EXCEPTION 'Le code MonWé ne peut pas être modifié';
  END IF;
  IF NEW.premium_until IS DISTINCT FROM OLD.premium_until THEN
    RAISE EXCEPTION 'premium_until ne peut pas être modifié';
  END IF;
  IF NEW.onboarded IS DISTINCT FROM OLD.onboarded
     AND coalesce(current_setting('monwe.allow_onboard', true), '') <> 'on' THEN
    RAISE EXCEPTION 'onboarded ne peut être modifié que via complete_onboarding()';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_profile_sensitive ON public.profiles;
CREATE TRIGGER trg_guard_profile_sensitive
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_sensitive();

CREATE OR REPLACE FUNCTION public.complete_onboarding()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE me uuid := auth.uid(); p public.profiles;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT * INTO p FROM public.profiles WHERE user_id = me;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profil introuvable'; END IF;
  IF coalesce(btrim(p.pseudo), '') = '' OR p.birthdate IS NULL OR coalesce(array_length(p.goals, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Pseudo, date de naissance et au moins un objectif sont requis';
  END IF;
  PERFORM set_config('monwe.allow_onboard', 'on', true);
  UPDATE public.profiles SET onboarded = true WHERE user_id = me;
  PERFORM set_config('monwe.allow_onboard', '', true);
END; $$;

REVOKE ALL ON FUNCTION public.complete_onboarding() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding() TO authenticated;
REVOKE ALL ON FUNCTION public.guard_profile_sensitive() FROM PUBLIC, anon, authenticated;