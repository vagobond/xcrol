-- Tighten UPDATE policy on group_posts to prevent changing user_id/group_id
DROP POLICY IF EXISTS "Users can update own group posts" ON public.group_posts;
CREATE POLICY "Users can update own group posts"
ON public.group_posts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure updated_at bumps on edit
DROP TRIGGER IF EXISTS group_posts_set_updated_at ON public.group_posts;
CREATE TRIGGER group_posts_set_updated_at
BEFORE UPDATE ON public.group_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();