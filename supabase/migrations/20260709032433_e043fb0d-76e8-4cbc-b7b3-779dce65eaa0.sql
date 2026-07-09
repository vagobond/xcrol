ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_posts;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.group_posts REPLICA IDENTITY FULL;