CREATE OR REPLACE FUNCTION public.guard_conversation_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ua uuid; ub uuid; me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN RETURN NEW; END IF; -- service role / internal
  IF NEW.match_id <> OLD.match_id OR NEW.id <> OLD.id OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Modification interdite';
  END IF;
  SELECT user_a, user_b INTO ua, ub FROM public.matches WHERE id = OLD.match_id;
  IF NEW.reveal_a IS DISTINCT FROM OLD.reveal_a AND me <> ua THEN
    RAISE EXCEPTION 'Tu ne peux modifier que ta propre révélation';
  END IF;
  IF NEW.reveal_b IS DISTINCT FROM OLD.reveal_b AND me <> ub THEN
    RAISE EXCEPTION 'Tu ne peux modifier que ta propre révélation';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_conversation_update ON public.conversations;
CREATE TRIGGER trg_guard_conversation_update BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.guard_conversation_update();

CREATE OR REPLACE FUNCTION public.reveal_myself(_conversation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE ua uuid; ub uuid; me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Non authentifié'; END IF;
  SELECT m.user_a, m.user_b INTO ua, ub FROM public.conversations c JOIN public.matches m ON m.id = c.match_id
  WHERE c.id = _conversation_id;
  IF me = ua THEN UPDATE public.conversations SET reveal_a = true WHERE id = _conversation_id;
  ELSIF me = ub THEN UPDATE public.conversations SET reveal_b = true WHERE id = _conversation_id;
  ELSE RAISE EXCEPTION 'Conversation introuvable';
  END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.reveal_myself(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reveal_myself(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_conversation_update() FROM PUBLIC, anon, authenticated;