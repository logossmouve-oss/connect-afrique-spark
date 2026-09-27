DROP POLICY IF EXISTS "Authenticated read profiles" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_revealed_between(_viewer uuid, _owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.matches m ON m.id = c.match_id
    WHERE c.reveal_a AND c.reveal_b
      AND ((m.user_a = _viewer AND m.user_b = _owner) OR (m.user_b = _viewer AND m.user_a = _owner))
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_original_photo(_viewer uuid, _owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _viewer IS NOT NULL AND (
    _viewer = _owner
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = _owner AND p.photo_blurred = false)
    OR public.is_revealed_between(_viewer, _owner)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_public_profiles(_ids uuid[] DEFAULT NULL, _limit int DEFAULT 200)
RETURNS TABLE (
  user_id uuid, pseudo text, monwe_code text, bio text, country text, city text,
  interests text[], goals public.relationship_goal[], languages text[], prompts jsonb,
  age int, last_seen timestamptz, has_photo boolean, public_photo_path text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.pseudo, p.monwe_code, p.bio, p.country, p.city,
         p.interests, p.goals, p.languages, p.prompts,
         CASE WHEN p.birthdate IS NULL THEN NULL ELSE date_part('year', age(p.birthdate))::int END,
         p.last_seen,
         p.photo_url IS NOT NULL,
         CASE WHEN p.photo_url IS NULL THEN NULL
              WHEN p.photo_blurred THEN p.user_id::text || '/public/avatar.jpg'
              ELSE p.photo_url END
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND (
      (_ids IS NOT NULL AND p.user_id = ANY(_ids))
      OR (_ids IS NULL AND p.onboarded AND p.user_id <> auth.uid())
    )
  LIMIT LEAST(COALESCE(_limit, 200), 500);
$$;

CREATE OR REPLACE FUNCTION public.get_revealed_profile(_other uuid)
RETURNS TABLE (user_id uuid, real_name text, photo_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.user_id, p.real_name, p.photo_url FROM public.profiles p
  WHERE p.user_id = _other AND auth.uid() IS NOT NULL
    AND (auth.uid() = _other OR public.is_revealed_between(auth.uid(), _other));
$$;

REVOKE EXECUTE ON FUNCTION public.is_revealed_between(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_view_original_photo(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[], int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_revealed_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_revealed_between(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_original_photo(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[], int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revealed_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated read avatars" ON storage.objects;
CREATE POLICY "Read avatars: own, public blurred, or authorized original" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'avatars' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR (storage.foldername(name))[2] = 'public'
    OR public.can_view_original_photo(auth.uid(), ((storage.foldername(name))[1])::uuid)
  )
);