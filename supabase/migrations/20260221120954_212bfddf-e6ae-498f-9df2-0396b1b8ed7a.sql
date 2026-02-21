
-- Add parent_reply_id to river_replies for nested comments
ALTER TABLE public.river_replies ADD COLUMN parent_reply_id uuid REFERENCES public.river_replies(id) ON DELETE CASCADE;

-- Create river_reply_reactions table
CREATE TABLE public.river_reply_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reply_id uuid NOT NULL REFERENCES public.river_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(reply_id, user_id, emoji)
);

ALTER TABLE public.river_reply_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reply reactions" ON public.river_reply_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add reply reactions" ON public.river_reply_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reply reactions" ON public.river_reply_reactions FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_river_reply_reactions_reply_id ON public.river_reply_reactions(reply_id);
CREATE INDEX idx_river_replies_parent_reply_id ON public.river_replies(parent_reply_id);
