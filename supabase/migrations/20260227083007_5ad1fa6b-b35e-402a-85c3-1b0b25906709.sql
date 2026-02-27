
CREATE OR REPLACE FUNCTION public.get_group_member_count(target_group_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.group_members
  WHERE group_id = target_group_id AND status = 'active';
$$;
