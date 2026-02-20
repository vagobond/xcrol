
-- Restrict sensitive columns on profiles table using column-level privileges.
-- Users can still read their OWN full profile via the "Users can view their own profile" RLS policy,
-- and SECURITY DEFINER functions (get_visible_profile, get_public_hometowns, etc.) bypass these grants.
-- 
-- Step 1: Revoke blanket SELECT on profiles from authenticated and anon roles
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;

-- Step 2: Grant SELECT only on non-sensitive columns
GRANT SELECT (
  id,
  display_name,
  avatar_url,
  bio,
  username,
  email,
  hometown_city,
  hometown_country,
  hometown_description,
  link,
  created_at,
  updated_at,
  invite_verified,
  last_hometown_change,
  birthday_no_year_visibility,
  birthday_year_visibility,
  home_address_visibility,
  mailing_address_visibility,
  nicknames_visibility
) ON public.profiles TO authenticated, anon;

-- Step 3: Grant SELECT on ALL columns but ONLY for own row via a security definer function.
-- We create a function that returns the full profile for the authenticated user.
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
