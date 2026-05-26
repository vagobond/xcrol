-- Revoke anon EXECUTE from SECURITY DEFINER functions that require an authenticated user.
-- Keep authenticated EXECUTE intact. Public-facing RPCs are left untouched.

DO $$
DECLARE
  fname text;
  sig text;
BEGIN
  FOR fname IN
    SELECT unnest(ARRAY[
      -- Admin-only
      'get_admin_profiles',
      'get_admin_profiles_by_ids',
      -- Scroll management (owner-only, checks auth.uid())
      'get_scroll_contents',
      'compile_scroll_draft',
      'publish_scroll',
      'unpublish_publication',
      -- Messaging (requires auth.uid())
      'get_message_profiles',
      -- Friend / social actions (mutating, requires auth)
      'accept_friend_request',
      'reject_friend_request',
      'send_friend_request',
      -- OAuth internals (edge functions use service role)
      'get_authorized_app_info',
      'verify_oauth_client_secret',
      -- Notifications / settings owner-only
      'get_user_notifications',
      'get_user_invite_stats',
      'get_available_invites',
      -- Role / permission helpers (not needed by anon)
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
      -- Points / stats (logged-in views)
      'calculate_all_user_points',
      'calculate_user_points',
      'calculate_layer_points',
      -- Own profile only
      'get_own_profile'
    ])
  LOOP
    FOR sig IN
      SELECT p.oid::regprocedure::text
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = fname
    LOOP
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', sig);
    END LOOP;
  END LOOP;
END
$$;