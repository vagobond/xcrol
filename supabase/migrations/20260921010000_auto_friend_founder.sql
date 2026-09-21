-- Auto-friend the founder (the "Tom from MySpace" behaviour).
--
-- Every new signup becomes connected to the founder account immediately, and
-- all existing users are backfilled. Friendships here are two asymmetric rows:
-- each side independently holds its own level for the other.
--
--   founder -> new user : 'friendly_acquaintance', needs_level_set = false
--   new user -> founder : 'friendly_acquaintance', needs_level_set = true
--
-- Why 'friendly_acquaintance' on the founder's side and not 'buddy':
-- friendship level is a PERMISSION system in this schema. hosting_requests
-- INSERT requires a friendly_acquaintance-or-above row, and hosting/meetup
-- preference visibility keys off level. 'friendly_acquaintance' is the lowest
-- real level, so this connects everyone without silently granting a stronger
-- relationship than intended.
--
-- needs_level_set = true on the new user's side means the app prompts them to
-- choose how they categorise the founder, rather than the system deciding a
-- relationship on their behalf. Their row is seeded at the same lowest level so
-- that, until they choose, no elevated permission is implied in either
-- direction.

-- ---------------------------------------------------------------------------
-- 1. Resolve the founder by username rather than hardcoding a UUID.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.founder_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.profiles WHERE username = 'cd' LIMIT 1;
$function$;

COMMENT ON FUNCTION public.founder_user_id() IS
  'The account every new signup is auto-friended with. Resolved by username so no UUID is hardcoded.';

-- ---------------------------------------------------------------------------
-- 2. Reusable link function, so the trigger and the backfill cannot drift.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.link_founder_friendship(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_founder uuid;
BEGIN
  v_founder := public.founder_user_id();

  -- No founder account, or the user IS the founder: nothing to do.
  IF v_founder IS NULL OR v_founder = target_user_id THEN
    RETURN;
  END IF;

  -- Both sides reference profiles(id), so both rows must already exist.
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RETURN;
  END IF;

  -- Founder -> user. Level already chosen, so no prompt for the founder.
  INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
  VALUES (v_founder, target_user_id, 'friendly_acquaintance', false)
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  -- User -> founder. Flagged so the app asks them to pick their own level.
  INSERT INTO public.friendships (user_id, friend_id, level, needs_level_set)
  VALUES (target_user_id, v_founder, 'friendly_acquaintance', true)
  ON CONFLICT (user_id, friend_id) DO NOTHING;
END;
$function$;

COMMENT ON FUNCTION public.link_founder_friendship(uuid) IS
  'Idempotent. ON CONFLICT DO NOTHING means re-running never overwrites a level a user has already chosen.';

-- ---------------------------------------------------------------------------
-- 3. Hook into signup.
--
-- handle_new_user() is the existing SECURITY DEFINER trigger on auth.users that
-- creates the profile row. The friendship insert is appended AFTER that insert
-- (friendships references profiles) and wrapped in its own exception block:
-- if auto-friending ever fails, it must not be able to break account creation.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
  display_name_value TEXT;
BEGIN
  -- Get display name from metadata, fallback to email prefix
  display_name_value := COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));

  -- LOWERCASE FIRST, then remove special chars
  base_username := regexp_replace(lower(display_name_value), '[^a-z0-9]', '', 'g');

  -- Ensure it's at least 2 characters (reverted from 3)
  IF length(base_username) < 2 THEN
    base_username := base_username || 'user';
  END IF;

  -- Start with the base username
  final_username := base_username;

  -- Check if username exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    new.id,
    new.email,
    display_name_value,
    final_username
  );

  -- Auto-friend the founder. Never allow this to abort a signup.
  BEGIN
    PERFORM public.link_founder_friendship(new.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'auto-friend founder failed for %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Backfill every existing user not already linked.
--    Idempotent via ON CONFLICT DO NOTHING inside link_founder_friendship.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  linked int := 0;
BEGIN
  IF public.founder_user_id() IS NULL THEN
    RAISE WARNING 'founder profile (username=cd) not found; backfill skipped';
    RETURN;
  END IF;

  FOR r IN
    SELECT id FROM public.profiles WHERE id <> public.founder_user_id()
  LOOP
    PERFORM public.link_founder_friendship(r.id);
    linked := linked + 1;
  END LOOP;

  RAISE NOTICE 'auto-friend backfill processed % profiles', linked;
END $$;
