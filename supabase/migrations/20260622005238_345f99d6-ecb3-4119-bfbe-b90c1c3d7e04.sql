
-- River replies: replace broad authenticated read with visibility check
DROP POLICY IF EXISTS "Authenticated users can view replies" ON public.river_replies;
DROP POLICY IF EXISTS "Anon can view replies on public entries" ON public.river_replies;

CREATE POLICY "Viewers can see replies on entries they can view"
ON public.river_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.xcrol_entries e
    WHERE e.id = river_replies.entry_id
      AND public.can_view_xcrol_entry(e.user_id, e.privacy_level, auth.uid())
  )
);

-- River reply reactions: same visibility as the underlying reply's entry
DROP POLICY IF EXISTS "Anyone can view reply reactions" ON public.river_reply_reactions;

CREATE POLICY "Viewers can see reactions on visible replies"
ON public.river_reply_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.river_replies r
    JOIN public.xcrol_entries e ON e.id = r.entry_id
    WHERE r.id = river_reply_reactions.reply_id
      AND public.can_view_xcrol_entry(e.user_id, e.privacy_level, auth.uid())
  )
);

-- Meetup preferences: drop the overly broad authenticated read policy
DROP POLICY IF EXISTS "Authenticated users can view meetup preferences" ON public.meetup_preferences;

-- Waitlist: fix broken dedupe policy and enforce uniqueness at the DB level
DROP POLICY IF EXISTS "Anyone can join waitlist once" ON public.waitlist;

CREATE POLICY "Anyone can join waitlist"
ON public.waitlist
FOR INSERT
WITH CHECK (true);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique ON public.waitlist (lower(email));
