
-- Add hometown coordinates and last_hometown_change to granted columns.
-- These are already exposed via get_public_hometowns() so not sensitive at column level.
GRANT SELECT (hometown_latitude, hometown_longitude, last_hometown_change) ON public.profiles TO authenticated, anon;
