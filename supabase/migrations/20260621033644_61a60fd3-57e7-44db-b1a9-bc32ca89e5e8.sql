
-- Helper: is the given group's trust_level = 'public'?
CREATE OR REPLACE FUNCTION public.is_public_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id AND trust_level = 'public'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_public_group(uuid) TO anon, authenticated;

-- ============================================================
-- River: anon can SELECT reactions and replies on public posts
-- ============================================================

-- xcrol_reactions: extend SELECT to anon for reactions on public entries
DROP POLICY IF EXISTS "Anon can view reactions on public entries" ON public.xcrol_reactions;
CREATE POLICY "Anon can view reactions on public entries"
ON public.xcrol_reactions
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.xcrol_entries e
    WHERE e.id = xcrol_reactions.entry_id
      AND e.privacy_level = 'public'
  )
);

GRANT SELECT ON public.xcrol_reactions TO anon;

-- river_replies: extend SELECT to anon for replies on public entries
DROP POLICY IF EXISTS "Anon can view replies on public entries" ON public.river_replies;
CREATE POLICY "Anon can view replies on public entries"
ON public.river_replies
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.xcrol_entries e
    WHERE e.id = river_replies.entry_id
      AND e.privacy_level = 'public'
  )
);

GRANT SELECT ON public.river_replies TO anon;

-- river_reply_reactions: already public SELECT, just ensure anon grant
GRANT SELECT ON public.river_reply_reactions TO anon;

-- ============================================================
-- Village: anon can SELECT posts/comments/reactions in PUBLIC groups
-- ============================================================

DROP POLICY IF EXISTS "Anon can view posts in public groups" ON public.group_posts;
CREATE POLICY "Anon can view posts in public groups"
ON public.group_posts
FOR SELECT
TO anon
USING (public.is_public_group(group_id));

GRANT SELECT ON public.group_posts TO anon;

DROP POLICY IF EXISTS "Anon can view comments in public groups" ON public.group_post_comments;
CREATE POLICY "Anon can view comments in public groups"
ON public.group_post_comments
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.id = group_post_comments.post_id
      AND public.is_public_group(gp.group_id)
  )
);

GRANT SELECT ON public.group_post_comments TO anon;

DROP POLICY IF EXISTS "Anon can view post reactions in public groups" ON public.group_post_reactions;
CREATE POLICY "Anon can view post reactions in public groups"
ON public.group_post_reactions
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.id = group_post_reactions.post_id
      AND public.is_public_group(gp.group_id)
  )
);

GRANT SELECT ON public.group_post_reactions TO anon;

DROP POLICY IF EXISTS "Anon can view comment reactions in public groups" ON public.group_comment_reactions;
CREATE POLICY "Anon can view comment reactions in public groups"
ON public.group_comment_reactions
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.group_post_comments c
    JOIN public.group_posts gp ON gp.id = c.post_id
    WHERE c.id = group_comment_reactions.comment_id
      AND public.is_public_group(gp.group_id)
  )
);

GRANT SELECT ON public.group_comment_reactions TO anon;

-- groups already has anon SELECT-eligible policy ("Anyone can view groups" USING true) but no anon grant
GRANT SELECT ON public.groups TO anon;
