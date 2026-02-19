
-- Allow group admins to upload group avatars
CREATE POLICY "Group admins can upload group avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'group-avatars'
  AND EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id::text = (storage.foldername(name))[2]
    AND public.is_group_admin(groups.id, auth.uid())
  )
);

-- Allow group admins to update group avatars
CREATE POLICY "Group admins can update group avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'group-avatars'
  AND EXISTS (
    SELECT 1 FROM public.groups
    WHERE groups.id::text = (storage.foldername(name))[2]
    AND public.is_group_admin(groups.id, auth.uid())
  )
);
