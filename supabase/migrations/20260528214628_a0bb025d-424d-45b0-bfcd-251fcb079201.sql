-- Column-level lockdown of public.profiles.
-- Sensitive PII is no longer directly selectable; it is only returned via the
-- SECURITY DEFINER functions get_own_profile() and get_visible_profile()
-- which enforce ownership and friendship-level visibility.

-- Remove broad SELECT on all columns from client roles.
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

-- Re-grant SELECT only on non-sensitive, public-facing columns.
GRANT SELECT (
  id,
  display_name,
  avatar_url,
  bio,
  link,
  username,
  created_at,
  updated_at,
  invite_verified,
  nostr_npub,
  nostr_handle,
  hometown_city,
  hometown_country,
  hometown_latitude,
  hometown_longitude,
  hometown_description,
  last_hometown_change
) ON public.profiles TO anon, authenticated;

-- service_role retains full access for edge functions / admin paths.
GRANT ALL ON public.profiles TO service_role;