
CREATE INDEX IF NOT EXISTS idx_messages_unread_to ON public.messages (to_user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_xcrol_entries_feed ON public.xcrol_entries (entry_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xcrol_reactions_entry ON public.xcrol_reactions (entry_id);
CREATE INDEX IF NOT EXISTS idx_group_post_reactions_post ON public.group_post_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_post_created ON public.group_post_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_group_comment_reactions_comment ON public.group_comment_reactions (comment_id);
CREATE INDEX IF NOT EXISTS idx_user_references_to_created ON public.user_references (to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user_status ON public.group_members (user_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_hometown_country ON public.profiles (hometown_country) WHERE hometown_city IS NOT NULL;
