
CREATE OR REPLACE FUNCTION public.calculate_all_user_points()
RETURNS TABLE(user_id uuid, points bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id AS user_id,
    COALESCE(
      (SELECT COUNT(*) FROM xcrol_entries xe WHERE xe.user_id = p.id) * 2 +
      (SELECT COUNT(*) FROM friendships f WHERE f.user_id = p.id) * 5 +
      (SELECT COUNT(*) FROM user_invites ui WHERE ui.inviter_id = p.id AND ui.status = 'accepted') * 10 +
      (SELECT COUNT(*) FROM user_references ur WHERE ur.from_user_id = p.id) * 3,
      0
    )::bigint AS points
  FROM profiles p;
END;
$$;
