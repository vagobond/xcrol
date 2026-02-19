
-- Create river_replies table
CREATE TABLE public.river_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.xcrol_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.river_replies ENABLE ROW LEVEL SECURITY;

-- Users can insert their own replies
CREATE POLICY "Users can insert their own replies"
ON public.river_replies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own replies
CREATE POLICY "Users can delete their own replies"
ON public.river_replies
FOR DELETE
USING (auth.uid() = user_id);

-- SELECT: users can see replies on entries they can view
-- The content masking is handled by the function, but we need basic SELECT access
CREATE POLICY "Authenticated users can view replies"
ON public.river_replies
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Index for fast lookup
CREATE INDEX idx_river_replies_entry_id ON public.river_replies(entry_id);
CREATE INDEX idx_river_replies_created_at ON public.river_replies(entry_id, created_at);

-- Function to get replies with privacy-aware content masking
CREATE OR REPLACE FUNCTION public.get_river_replies(
  p_entry_ids UUID[],
  p_viewer_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  entry_id UUID,
  user_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  author_display_name TEXT,
  author_avatar_url TEXT,
  author_username TEXT,
  can_view_content BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.entry_id,
    r.user_id,
    -- Only show content if viewer is the author OR viewer is friends with the replier
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
    -- can_view_content flag
    CASE
      WHEN p_viewer_id IS NULL THEN false
      WHEN r.user_id = p_viewer_id THEN true
      WHEN EXISTS (
        SELECT 1 FROM friendships f
        WHERE f.user_id = p_viewer_id AND f.friend_id = r.user_id
        AND f.level IN ('close_friend', 'buddy', 'friendly_acquaintance', 'family', 'secret_friend')
      ) THEN true
      ELSE false
    END AS can_view_content
  FROM river_replies r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.entry_id = ANY(p_entry_ids)
  ORDER BY r.created_at ASC;
END;
$$;
