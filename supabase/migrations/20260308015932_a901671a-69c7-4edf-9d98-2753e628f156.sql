CREATE POLICY "Anyone can view public xcrol entries"
ON public.xcrol_entries FOR SELECT
TO anon, authenticated
USING (privacy_level = 'public');