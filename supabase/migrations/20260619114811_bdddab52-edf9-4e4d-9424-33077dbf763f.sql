
-- 1. Move precise_address into its own gated table
CREATE TABLE IF NOT EXISTS public.host_precise_addresses (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_precise_addresses TO authenticated;
GRANT ALL ON public.host_precise_addresses TO service_role;

ALTER TABLE public.host_precise_addresses ENABLE ROW LEVEL SECURITY;

-- Backfill from old column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hosting_preferences' AND column_name='precise_address') THEN
    INSERT INTO public.host_precise_addresses (user_id, address)
    SELECT user_id, precise_address FROM public.hosting_preferences
    WHERE precise_address IS NOT NULL AND length(trim(precise_address)) > 0
    ON CONFLICT (user_id) DO NOTHING;

    ALTER TABLE public.hosting_preferences DROP COLUMN precise_address;
  END IF;
END $$;

CREATE POLICY "Owner manages own precise address"
ON public.host_precise_addresses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Accepted guest can view host precise address"
ON public.host_precise_addresses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hosting_requests hr
    WHERE hr.to_user_id = host_precise_addresses.user_id
      AND hr.from_user_id = auth.uid()
      AND hr.status = 'accepted'
  )
);

CREATE TRIGGER update_host_precise_addresses_updated_at
BEFORE UPDATE ON public.host_precise_addresses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Tighten calendar RLS — mirror hosting_preferences visibility
DROP POLICY IF EXISTS "Authenticated can view blackout periods" ON public.host_blackout_periods;
CREATE POLICY "View blackout periods for open hosts"
ON public.host_blackout_periods
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.hosting_preferences hp
    WHERE hp.user_id = host_blackout_periods.user_id
      AND hp.is_open_to_hosting = true
      AND NOT public.is_blocked(hp.user_id, auth.uid())
      AND NOT public.is_blocked(auth.uid(), hp.user_id)
  )
);

DROP POLICY IF EXISTS "Authenticated can view recurring unavailability" ON public.host_recurring_unavailability;
CREATE POLICY "View recurring unavailability for open hosts"
ON public.host_recurring_unavailability
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.hosting_preferences hp
    WHERE hp.user_id = host_recurring_unavailability.user_id
      AND hp.is_open_to_hosting = true
      AND NOT public.is_blocked(hp.user_id, auth.uid())
      AND NOT public.is_blocked(auth.uid(), hp.user_id)
  )
);

-- 3. Add WITH CHECK to hosting_preferences UPDATE
DROP POLICY IF EXISTS "Users can update their own hosting preferences" ON public.hosting_preferences;
CREATE POLICY "Users can update their own hosting preferences"
ON public.hosting_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Add WITH CHECK + status-transition guard to hosting_requests UPDATE.
-- Rules:
--   * from_user (guest) may update their own request, but CANNOT set status to 'accepted'.
--   * to_user (host) may update the request, including accepting/declining.
--   * Neither party may reassign from_user_id / to_user_id.
DROP POLICY IF EXISTS "Users can update hosting requests they participate in" ON public.hosting_requests;
CREATE POLICY "Users can update hosting requests they participate in"
ON public.hosting_requests
FOR UPDATE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
WITH CHECK (
  (auth.uid() = to_user_id)
  OR (auth.uid() = from_user_id AND status <> 'accepted')
);
