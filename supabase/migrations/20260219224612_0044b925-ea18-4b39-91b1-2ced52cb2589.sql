
-- Drop the existing insert policy
DROP POLICY "Users can request to join groups" ON public.group_members;

-- Recreate with allowance for group creators to add themselves as active admin
CREATE POLICY "Users can request to join groups"
ON public.group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    status = 'pending'
    OR is_group_admin(group_id, auth.uid())
    OR (
      status = 'active'
      AND role = 'admin'
      AND EXISTS (
        SELECT 1 FROM public.groups
        WHERE groups.id = group_members.group_id
        AND groups.creator_id = auth.uid()
      )
    )
  )
);
