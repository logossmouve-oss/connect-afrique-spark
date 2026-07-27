CREATE POLICY "Conversation participants mark messages read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN matches m ON m.id = c.match_id
    WHERE c.id = messages.conversation_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);
