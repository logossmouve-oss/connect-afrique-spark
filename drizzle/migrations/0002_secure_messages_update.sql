REVOKE UPDATE ON public.messages FROM authenticated, anon;
GRANT UPDATE (read_at) ON public.messages TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_message_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN RETURN NEW; END IF; -- service role / internal only
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Seul le statut de lecture peut être modifié';
  END IF;
  IF NEW.read_at IS DISTINCT FROM OLD.read_at THEN
    IF me = OLD.sender_id THEN
      RAISE EXCEPTION 'Tu ne peux pas marquer ton propre message comme lu';
    END IF;
    IF OLD.read_at IS NOT NULL OR NEW.read_at IS NULL THEN
      RAISE EXCEPTION 'Un message ne peut être marqué lu qu''une seule fois';
    END IF;
  END IF;
  RETURN NEW;
END; $$;
REVOKE EXECUTE ON FUNCTION public.guard_message_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_message_update ON public.messages;
CREATE TRIGGER trg_guard_message_update BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.guard_message_update();

DROP POLICY IF EXISTS "Conversation participants mark messages read" ON public.messages;
CREATE POLICY "Recipient marks received messages read" ON public.messages
FOR UPDATE TO authenticated
USING (
  auth.uid() <> sender_id AND EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
)
WITH CHECK (
  auth.uid() <> sender_id AND EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);