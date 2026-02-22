
-- Admin-only function to get all profiles with email (bypasses column-level revoke on email)
CREATE OR REPLACE FUNCTION public.get_admin_profiles()
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT p.id, p.display_name, p.username, p.email, p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;

-- Admin-only function to get profiles by IDs with email
CREATE OR REPLACE FUNCTION public.get_admin_profiles_by_ids(p_ids uuid[])
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT p.id, p.display_name, p.username, p.email
  FROM public.profiles p
  WHERE p.id = ANY(p_ids);
END;
$$;
