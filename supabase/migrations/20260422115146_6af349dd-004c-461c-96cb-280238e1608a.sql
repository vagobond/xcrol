-- 1) Add notify_world_activity to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS notify_world_activity boolean NOT NULL DEFAULT true;

-- 2) Trigger: new group_posts -> notify all OTHER active members
CREATE OR REPLACE FUNCTION public.notify_group_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, entity_id)
  SELECT gm.user_id, NEW.user_id, 'group_post', NEW.id
  FROM group_members gm
  WHERE gm.group_id = NEW.group_id
    AND gm.status = 'active'
    AND gm.user_id <> NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_group_post ON public.group_posts;
CREATE TRIGGER trg_notify_group_post
AFTER INSERT ON public.group_posts
FOR EACH ROW EXECUTE FUNCTION public.notify_group_post();

-- 3) Trigger: introduction_requests -> notify the introducer
CREATE OR REPLACE FUNCTION public.notify_introduction_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, entity_id)
  VALUES (NEW.introducer_id, NEW.requester_id, 'introduction_request', NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_introduction_request ON public.introduction_requests;
CREATE TRIGGER trg_notify_introduction_request
AFTER INSERT ON public.introduction_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_introduction_request();

-- 4) Trigger: nearby_hometown — when a profile's hometown is set/changed,
--    notify other users with hometowns within ~2 degrees (~200km) of the new coords.
CREATE OR REPLACE FUNCTION public.notify_nearby_hometown()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.hometown_latitude IS NULL OR NEW.hometown_longitude IS NULL THEN
    RETURN NEW;
  END IF;
  -- Skip if coords didn't actually change on UPDATE
  IF TG_OP = 'UPDATE' AND
     OLD.hometown_latitude IS NOT DISTINCT FROM NEW.hometown_latitude AND
     OLD.hometown_longitude IS NOT DISTINCT FROM NEW.hometown_longitude THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, actor_id, type, entity_id)
  SELECT p.id, NEW.id, 'nearby_hometown', NEW.id
  FROM profiles p
  WHERE p.id <> NEW.id
    AND p.hometown_latitude IS NOT NULL
    AND p.hometown_longitude IS NOT NULL
    AND abs(p.hometown_latitude - NEW.hometown_latitude) < 2
    AND abs(p.hometown_longitude - NEW.hometown_longitude) < 2
  LIMIT 200;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_nearby_hometown ON public.profiles;
CREATE TRIGGER trg_notify_nearby_hometown
AFTER INSERT OR UPDATE OF hometown_latitude, hometown_longitude ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_nearby_hometown();

-- 5) Extend get_user_notifications: add p_include_read + p_types
CREATE OR REPLACE FUNCTION public.get_user_notifications(
  p_user_id uuid,
  p_include_read boolean DEFAULT false,
  p_types text[] DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'friend_requests', COALESCE((
      SELECT json_agg(row_to_json(fr_row))
      FROM (
        SELECT fr.id, fr.from_user_id, fr.message, fr.created_at,
               p.display_name AS from_display_name, p.avatar_url AS from_avatar_url
        FROM friend_requests fr
        LEFT JOIN profiles p ON p.id = fr.from_user_id
        WHERE fr.to_user_id = p_user_id
        ORDER BY fr.created_at DESC
      ) fr_row
    ), '[]'::json),
    'pending_friendships', COALESCE((
      SELECT json_agg(row_to_json(pf_row))
      FROM (
        SELECT f.id, f.friend_id,
               p.display_name AS friend_display_name, p.avatar_url AS friend_avatar_url
        FROM friendships f
        LEFT JOIN profiles p ON p.id = f.friend_id
        WHERE f.user_id = p_user_id AND f.needs_level_set = true
      ) pf_row
    ), '[]'::json),
    'unread_message_senders', COALESCE((
      SELECT json_agg(row_to_json(ums_row))
      FROM (
        SELECT DISTINCT ON (p.id) p.id, p.display_name, p.avatar_url
        FROM messages m
        JOIN profiles p ON p.id = m.from_user_id
        WHERE m.to_user_id = p_user_id AND m.read_at IS NULL
      ) ums_row
    ), '[]'::json),
    'new_references', COALESCE((
      SELECT json_agg(row_to_json(nr_row))
      FROM (
        SELECT ur.id, ur.from_user_id, ur.reference_type, ur.rating, ur.created_at,
               p.display_name AS from_display_name, p.avatar_url AS from_avatar_url, p.username AS from_username,
               EXISTS (
                 SELECT 1 FROM user_references ur2
                 WHERE ur2.from_user_id = p_user_id AND ur2.to_user_id = ur.from_user_id
               ) AS has_return_ref
        FROM user_references ur
        LEFT JOIN profiles p ON p.id = ur.from_user_id
        WHERE ur.to_user_id = p_user_id
          AND ur.created_at >= (now() - interval '30 days')
        ORDER BY ur.created_at DESC
      ) nr_row
    ), '[]'::json),
    'interaction_notifications', COALESCE((
      SELECT json_agg(row_to_json(in_row))
      FROM (
        SELECT n.id, n.actor_id, n.type, n.entity_id, n.created_at, n.read_at,
               p.display_name AS actor_display_name, p.avatar_url AS actor_avatar_url
        FROM notifications n
        LEFT JOIN profiles p ON p.id = n.actor_id
        WHERE n.user_id = p_user_id
          AND (p_types IS NULL OR n.type = ANY(p_types))
          AND (
            (p_include_read = false AND n.read_at IS NULL)
            OR (p_include_read = true AND n.created_at >= (now() - interval '14 days'))
          )
        ORDER BY n.created_at DESC
        LIMIT 50
      ) in_row
    ), '[]'::json),
    'notification_settings', (
      SELECT row_to_json(s)
      FROM (
        SELECT notify_river_replies, notify_brook_activity, notify_hosting_requests,
               notify_meetup_requests, notify_group_activity, notify_world_activity
        FROM user_settings
        WHERE user_id = p_user_id
        LIMIT 1
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$function$;