
-- Group post reactions
CREATE TABLE public.group_post_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, emoji)
);

ALTER TABLE public.group_post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group post reactions"
ON public.group_post_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.id = group_post_reactions.post_id
    AND public.is_group_member(gp.group_id, auth.uid())
  )
);

CREATE POLICY "Members can add group post reactions"
ON public.group_post_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.id = group_post_reactions.post_id
    AND public.is_group_member(gp.group_id, auth.uid())
  )
);

CREATE POLICY "Users can remove their own group post reactions"
ON public.group_post_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Group post comments
CREATE TABLE public.group_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.group_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group post comments"
ON public.group_post_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.id = group_post_comments.post_id
    AND public.is_group_member(gp.group_id, auth.uid())
  )
);

CREATE POLICY "Members can add group post comments"
ON public.group_post_comments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_posts gp
    WHERE gp.id = group_post_comments.post_id
    AND public.is_group_member(gp.group_id, auth.uid())
  )
);

CREATE POLICY "Users can delete their own group post comments"
ON public.group_post_comments FOR DELETE
USING (auth.uid() = user_id);

-- Group comment reactions
CREATE TABLE public.group_comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.group_post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id, emoji)
);

ALTER TABLE public.group_comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group comment reactions"
ON public.group_comment_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_post_comments gpc
    JOIN public.group_posts gp ON gp.id = gpc.post_id
    WHERE gpc.id = group_comment_reactions.comment_id
    AND public.is_group_member(gp.group_id, auth.uid())
  )
);

CREATE POLICY "Members can add group comment reactions"
ON public.group_comment_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_post_comments gpc
    JOIN public.group_posts gp ON gp.id = gpc.post_id
    WHERE gpc.id = group_comment_reactions.comment_id
    AND public.is_group_member(gp.group_id, auth.uid())
  )
);

CREATE POLICY "Users can remove their own group comment reactions"
ON public.group_comment_reactions FOR DELETE
USING (auth.uid() = user_id);
