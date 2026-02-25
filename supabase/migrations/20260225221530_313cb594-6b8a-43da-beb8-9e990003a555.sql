
ALTER TABLE public.groups
  ADD COLUMN require_approval boolean NOT NULL DEFAULT false;

-- Update the group_members INSERT policy to allow direct active join for open groups
DROP POLICY IF EXISTS "Users can request to join groups" ON public.group_members;

CREATE POLICY "Users can request to join groups" ON public.group_members
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id)
    AND (
      -- Admin self-insert (group creation)
      (
        status = 'active' AND role = 'admin'
        AND EXISTS (
          SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.creator_id = auth.uid()
        )
      )
      -- Open group: join directly as active
      OR (
        status = 'active' AND role = 'member'
        AND EXISTS (
          SELECT 1 FROM groups
          WHERE groups.id = group_members.group_id AND groups.require_approval = false
        )
        AND NOT is_group_member(group_id, auth.uid())
      )
      -- Managed group: request as pending
      OR (
        status = 'pending'
      )
      -- Existing admin adding
      OR is_group_admin(group_id, auth.uid())
    )
  );
