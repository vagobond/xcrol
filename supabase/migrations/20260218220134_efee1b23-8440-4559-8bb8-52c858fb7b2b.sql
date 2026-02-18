
DROP POLICY "Users can update their own entries" ON public.xcrol_entries;

CREATE POLICY "Users can update their own entries"
ON public.xcrol_entries
FOR UPDATE
USING (auth.uid() = user_id);
