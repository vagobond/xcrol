-- 1. Replace "Anyone can view meetups" with authenticated-only
DROP POLICY IF EXISTS "Anyone can view meetups" ON public.meetups;
CREATE POLICY "Authenticated users can view meetups"
  ON public.meetups
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Drop "Anyone can view references" from user_references (other authenticated SELECT policies remain)
DROP POLICY IF EXISTS "Anyone can view references" ON public.user_references;