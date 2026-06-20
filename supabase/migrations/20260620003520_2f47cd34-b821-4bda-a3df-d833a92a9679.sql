-- Tier 3: skills-exchange compensation, private emergency contact, host page shareability

-- 1. Skills offered in hosting requests (free text; #13 work-exchange context)
ALTER TABLE public.hosting_requests
  ADD COLUMN IF NOT EXISTS skills_offered TEXT;

-- 2. Private emergency contact in user_settings (#15)
--    Existing RLS on user_settings already restricts SELECT/UPDATE/INSERT
--    to auth.uid() = user_id. Admin tooling reads via service_role only.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS emergency_contact TEXT;

COMMENT ON COLUMN public.user_settings.emergency_contact IS
  'Private next-of-kin / emergency contact. Visible only to the owner and to admins via service_role during a flagged stay. Never exposed to other users.';