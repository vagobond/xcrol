DO $$
DECLARE
  fname text;
  sig text;
BEGIN
  FOR fname IN
    SELECT unnest(ARRAY[
      'get_admin_profiles',
      'get_admin_profiles_by_ids',
      'get_scroll_contents',
      'compile_scroll_draft',
      'publish_scroll',
      'unpublish_publication',
      'get_message_profiles',
      'accept_friend_request',
      'reject_friend_request',
      'send_friend_request',
      'get_authorized_app_info',
      'verify_oauth_client_secret',
      'get_user_notifications',
      'get_user_invite_stats',
      'get_available_invites',
      'has_role',
      'is_group_admin',
      'is_group_member',
      'is_blocked',
      'has_brook_with',
      'can_create_brook',
      'can_delete_brook',
      'can_post_in_brook',
      'meets_group_trust_level',
      'are_mutual_close_friends',
      'is_within_three_degrees',
      'get_friendship_level',
      'calculate_all_user_points',
      'calculate_user_points',
      'calculate_layer_points',
      'get_own_profile',
      'refresh_layer_stats',
      'use_invite_code',
      'validate_invite_code'
    ])
  LOOP
    FOR sig IN
      SELECT p.oid::regprocedure::text
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fname
    LOOP
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', sig);
    END LOOP;
  END LOOP;
END
$$;