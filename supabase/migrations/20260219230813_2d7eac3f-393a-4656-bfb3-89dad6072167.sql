
-- Drop broken policies
DROP POLICY IF EXISTS "Group admins can upload group avatars" ON storage.objects;
DROP POLICY IF EXISTS "Group admins can update group avatars" ON storage.objects;

-- Recreate with correct reference to storage object name (not groups.name)
CREATE POLICY "Group admins can upload group avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'group-avatars'
  AND EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id::text = (storage.foldername(objects.name))[2]
    AND public.is_group_admin(groups.id, auth.uid())
  )
);

CREATE POLICY "Group admins can update group avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'group-avatars'
  AND EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id::text = (storage.foldername(objects.name))[2]
    AND public.is_group_admin(groups.id, auth.uid())
  )
);
