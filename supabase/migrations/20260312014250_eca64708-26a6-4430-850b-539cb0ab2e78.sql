
-- Table: user_rss_feeds
CREATE TABLE public.user_rss_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_url text NOT NULL,
  feed_name text,
  feed_icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feed_url)
);

ALTER TABLE public.user_rss_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own RSS feeds"
ON public.user_rss_feeds FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table: rss_feed_items
CREATE TABLE public.rss_feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES public.user_rss_feeds(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  link text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  guid text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feed_id, guid)
);

ALTER TABLE public.rss_feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own RSS items"
ON public.rss_feed_items FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Index for River query performance
CREATE INDEX idx_rss_feed_items_user_published ON public.rss_feed_items (user_id, published_at DESC);

-- Update get_river_entries to include RSS items
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
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF p_filter = 'rss' THEN
    -- RSS only
    RETURN QUERY
    SELECT
      ri.id,
      ri.title AS content,
      ri.link,
      (ri.published_at AT TIME ZONE 'UTC')::date AS entry_date,
      'rss'::text AS privacy_level,
      ri.user_id,
      rf.feed_name AS author_display_name,
      rf.feed_icon AS author_avatar_url,
      NULL::text AS author_username
    FROM rss_feed_items ri
    JOIN user_rss_feeds rf ON rf.id = ri.feed_id
    WHERE ri.user_id = p_viewer_id
    ORDER BY ri.published_at DESC
    LIMIT p_limit OFFSET p_offset;
  ELSIF p_filter = 'all' AND p_viewer_id IS NOT NULL THEN
    -- Mix xcrol entries + RSS
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
      SELECT
        ri.id, ri.title, ri.link,
        (ri.published_at AT TIME ZONE 'UTC')::date,
        'rss'::text, ri.user_id,
        rf.feed_name, rf.feed_icon, NULL::text
      FROM rss_feed_items ri
      JOIN user_rss_feeds rf ON rf.id = ri.feed_id
      WHERE ri.user_id = p_viewer_id
    )
    ORDER BY entry_date DESC
    LIMIT p_limit OFFSET p_offset;
  ELSE
    -- Original behavior for all other filters (or anonymous 'all')
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
        OR (p_filter = 'public' AND e.privacy_level = 'public')
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
