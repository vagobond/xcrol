
DROP FUNCTION get_river_replies(uuid[], uuid);

CREATE FUNCTION get_river_replies(p_entry_ids uuid[], p_viewer_id uuid DEFAULT NULL)
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.entry_id,
    r.user_id,
    CASE
      WHEN p_viewer_id IS NULL THEN NULL::TEXT
      WHEN r.user_id = p_viewer_id THEN r.content
      WHEN EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.user_id = p_viewer_id AND f.friend_id = r.user_id
        AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'family', 'secret_friend')
      ) THEN r.content
      ELSE NULL::TEXT
    END AS content,
    r.created_at,
    p.display_name,
    p.avatar_url,
    p.username,
    CASE
      WHEN p_viewer_id IS NULL THEN false
      WHEN r.user_id = p_viewer_id THEN true
      WHEN EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.user_id = p_viewer_id AND f.friend_id = r.user_id
        AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'family', 'secret_friend')
      ) THEN true
      ELSE false
    END AS can_view_content,
    r.parent_reply_id
  FROM river_replies r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.entry_id = ANY(p_entry_ids)
  ORDER BY r.created_at ASC;
END;
$$;
