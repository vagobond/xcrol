ALTER TABLE public.user_settings
  ADD COLUMN notify_river_replies boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_brook_activity boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_hosting_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_meetup_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_group_activity boolean NOT NULL DEFAULT true;