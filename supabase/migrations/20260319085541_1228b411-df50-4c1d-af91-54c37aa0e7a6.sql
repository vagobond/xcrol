
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_user_id uuid)
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
        SELECT n.id, n.actor_id, n.type, n.entity_id, n.created_at,
               p.display_name AS actor_display_name, p.avatar_url AS actor_avatar_url
        FROM notifications n
        LEFT JOIN profiles p ON p.id = n.actor_id
        WHERE n.user_id = p_user_id AND n.read_at IS NULL
        ORDER BY n.created_at DESC
        LIMIT 50
      ) in_row
    ), '[]'::json),
    'notification_settings', (
      SELECT row_to_json(s)
      FROM (
        SELECT notify_river_replies, notify_brook_activity, notify_hosting_requests,
               notify_meetup_requests, notify_group_activity
        FROM user_settings
        WHERE user_id = p_user_id
        LIMIT 1
      ) s
    )
  ) INTO result;
  
  RETURN result;
END;
$function$;
