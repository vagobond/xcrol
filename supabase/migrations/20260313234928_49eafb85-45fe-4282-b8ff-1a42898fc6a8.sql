CREATE OR REPLACE FUNCTION public.get_river_entries(
  p_viewer_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_filter text DEFAULT 'all'
)
RETURNS TABLE(
  id uuid, content text, link text, entry_date date, privacy_level text,
  user_id uuid, author_display_name text, author_avatar_url text, author_username text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF p_filter = 'rss' THEN
    RETURN QUERY
    SELECT sub.id, sub.content, sub.link, sub.entry_date, sub.privacy_level,
           sub.user_id, sub.author_display_name, sub.author_avatar_url, sub.author_username
    FROM (
      SELECT
        ri.id,
        COALESCE(ri.title, 'Untitled') || CASE WHEN ri.content IS NOT NULL AND ri.content != '' THEN E'\n\n' || ri.content ELSE '' END AS content,
        ri.link,
        (ri.published_at AT TIME ZONE 'UTC')::date AS entry_date,
        'rss'::text AS privacy_level,
        ri.user_id,
        rf.feed_name AS author_display_name,
        rf.feed_icon AS author_avatar_url,
        NULL::text AS author_username,
        ri.published_at,
        ROW_NUMBER() OVER (PARTITION BY ri.feed_id ORDER BY ri.published_at DESC) AS rn,
        rf.max_items
      FROM rss_feed_items ri
      JOIN user_rss_feeds rf ON rf.id = ri.feed_id
      WHERE ri.user_id = p_viewer_id
    ) sub
    WHERE sub.rn <= sub.max_items
    ORDER BY sub.published_at DESC
    LIMIT p_limit OFFSET p_offset;
  ELSIF p_filter = 'all' AND p_viewer_id IS NOT NULL THEN
    RETURN QUERY
    (
      SELECT
        e.id, e.content, e.link, e.entry_date, e.privacy_level, e.user_id,
        p.display_name, p.avatar_url, p.username
      FROM xcrol_entries e
      JOIN profiles p ON p.id = e.user_id
      WHERE public.can_view_xcrol_entry(e.user_id, e.privacy_level, p_viewer_id)
    )
    UNION ALL
    (
      SELECT sub2.id, sub2.content, sub2.link, sub2.entry_date, sub2.privacy_level,
             sub2.user_id, sub2.author_display_name, sub2.author_avatar_url, sub2.author_username
      FROM (
        SELECT
          ri.id,
          COALESCE(ri.title, 'Untitled') || CASE WHEN ri.content IS NOT NULL AND ri.content != '' THEN E'\n\n' || ri.content ELSE '' END AS content,
          ri.link,
          (ri.published_at AT TIME ZONE 'UTC')::date AS entry_date,
          'rss'::text AS privacy_level, ri.user_id,
          rf.feed_name AS author_display_name, rf.feed_icon AS author_avatar_url, NULL::text AS author_username,
          ROW_NUMBER() OVER (PARTITION BY ri.feed_id ORDER BY ri.published_at DESC) AS rn,
          rf.max_items
        FROM rss_feed_items ri
        JOIN user_rss_feeds rf ON rf.id = ri.feed_id
        WHERE ri.user_id = p_viewer_id
      ) sub2
      WHERE sub2.rn <= sub2.max_items
    )
    ORDER BY entry_date DESC
    LIMIT p_limit OFFSET p_offset;
  ELSIF p_filter = 'public' THEN
    RETURN QUERY
    SELECT
      e.id, e.content, e.link, e.entry_date, e.privacy_level, e.user_id,
      p.display_name, p.avatar_url, p.username
    FROM xcrol_entries e
    JOIN profiles p ON p.id = e.user_id
    WHERE public.can_view_xcrol_entry(e.user_id, e.privacy_level, p_viewer_id)
    ORDER BY e.entry_date DESC, e.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  ELSE
    RETURN QUERY
    SELECT
      e.id, e.content, e.link, e.entry_date, e.privacy_level, e.user_id,
      p.display_name, p.avatar_url, p.username
    FROM xcrol_entries e
    JOIN profiles p ON p.id = e.user_id
    WHERE
      public.can_view_xcrol_entry(e.user_id, e.privacy_level, p_viewer_id)
      AND (
        p_filter = 'all'
        OR (p_filter = 'family' AND (
          e.user_id = p_viewer_id
          OR EXISTS (
            SELECT 1 FROM friendships f
            WHERE f.user_id = p_viewer_id AND f.friend_id = e.user_id AND f.level = 'family'
          )
        ))
        OR (p_filter IN ('close_friend', 'buddy', 'friendly_acquaintance') AND (
          e.user_id = p_viewer_id
          OR EXISTS (
            SELECT 1 FROM friendships f
            WHERE f.user_id = p_viewer_id AND f.friend_id = e.user_id
            AND (
              (p_filter = 'friendly_acquaintance' AND f.level IN ('close_friend', 'secret_friend', 'buddy', 'friendly_acquaintance'))
              OR (p_filter = 'buddy' AND f.level IN ('close_friend', 'secret_friend', 'buddy'))
              OR (p_filter = 'close_friend' AND f.level IN ('close_friend', 'secret_friend'))
            )
          )
        ))
      )
    ORDER BY e.entry_date DESC, e.created_at DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$function$;