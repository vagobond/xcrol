-- Grant anon EXECUTE on group helper functions so PostgREST can evaluate
-- existing policies without 42501 errors when a guest reads public groups.
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO anon;