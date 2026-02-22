
CREATE OR REPLACE FUNCTION public.calculate_all_user_points()
RETURNS TABLE(user_id uuid, points bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id AS user_id,
    public.calculate_user_points(p.id)::bigint AS points
  FROM public.profiles p;
END;
$$;
