
DROP FUNCTION IF EXISTS public.get_river_replies(uuid[], uuid);

CREATE FUNCTION public.get_river_replies(p_entry_ids uuid[], p_viewer_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  entry_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  display_name text,
  avatar_url text,
  username text,
  can_view_content boolean,
  parent_reply_id uuid
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE base AS (
    SELECT
      r.id,
      r.entry_id,
      r.user_id,
      r.content,
      r.created_at,
      r.parent_reply_id,
      CASE
        WHEN p_viewer_id IS NULL THEN false
        WHEN r.user_id = p_viewer_id THEN true
        WHEN EXISTS (
          SELECT 1 FROM friendships f
          WHERE f.user_id = p_viewer_id AND f.friend_id = r.user_id
            AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'family', 'secret_friend')
        ) THEN true
        ELSE false
      END AS visible_here
    FROM river_replies r
    WHERE r.entry_id = ANY(p_entry_ids)
  ),
  chain AS (
    SELECT b.id AS leaf_id, b.id AS node_id, b.parent_reply_id, b.visible_here
    FROM base b
    UNION ALL
    SELECT c.leaf_id, b.id, b.parent_reply_id, b.visible_here
    FROM chain c
    JOIN base b ON b.id = c.parent_reply_id
  ),
  visibility AS (
    SELECT leaf_id, BOOL_OR(visible_here) AS can_view
    FROM chain
    GROUP BY leaf_id
  )
  SELECT
    b.id,
    b.entry_id,
    b.user_id,
    CASE WHEN v.can_view THEN b.content ELSE NULL::text END AS content,
    b.created_at,
    p.display_name,
    p.avatar_url,
    p.username,
    COALESCE(v.can_view, false) AS can_view_content,
    b.parent_reply_id
  FROM base b
  JOIN profiles p ON p.id = b.user_id
  LEFT JOIN visibility v ON v.leaf_id = b.id
  ORDER BY b.created_at ASC;
END;
$$;
