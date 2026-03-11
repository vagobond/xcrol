CREATE POLICY "Anon can view profiles for public posts"
ON public.profiles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.xcrol_entries e
    WHERE e.user_id = profiles.id
    AND e.privacy_level = 'public'
  )
);