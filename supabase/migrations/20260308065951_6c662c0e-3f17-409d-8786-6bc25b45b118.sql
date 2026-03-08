DROP POLICY "Users can create references for friends or after interaction" ON public.user_references;

CREATE POLICY "Users can create references for friends or after interaction"
ON public.user_references
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);