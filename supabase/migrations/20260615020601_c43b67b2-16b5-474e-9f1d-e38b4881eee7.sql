
-- Host availability calendar

CREATE TABLE public.host_blackout_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  kind TEXT NOT NULL DEFAULT 'blackout' CHECK (kind IN ('blackout','booked')),
  note TEXT,
  source_hosting_request_id UUID REFERENCES public.hosting_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_blackout_periods TO authenticated;
GRANT ALL ON public.host_blackout_periods TO service_role;

ALTER TABLE public.host_blackout_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view blackout periods"
ON public.host_blackout_periods FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner can insert own blackout"
ON public.host_blackout_periods FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can update own blackout"
ON public.host_blackout_periods FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner can delete own blackout"
ON public.host_blackout_periods FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_blackout_user_dates ON public.host_blackout_periods(user_id, start_date, end_date);

CREATE TRIGGER update_blackout_updated_at
BEFORE UPDATE ON public.host_blackout_periods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.host_recurring_unavailability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.host_recurring_unavailability TO authenticated;
GRANT ALL ON public.host_recurring_unavailability TO service_role;

ALTER TABLE public.host_recurring_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view recurring unavailability"
ON public.host_recurring_unavailability FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Owner can manage own recurring unavailability"
ON public.host_recurring_unavailability FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Auto-block trigger when hosting request status flips to/from accepted
CREATE OR REPLACE FUNCTION public.sync_hosting_request_blackout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status <> 'accepted')
     OR (TG_OP = 'DELETE') THEN
    DELETE FROM public.host_blackout_periods
    WHERE source_hosting_request_id = OLD.id;
  END IF;

  IF TG_OP <> 'DELETE'
     AND NEW.status = 'accepted'
     AND NEW.arrival_date IS NOT NULL
     AND NEW.departure_date IS NOT NULL THEN
    INSERT INTO public.host_blackout_periods
      (user_id, start_date, end_date, kind, note, source_hosting_request_id)
    VALUES
      (NEW.to_user_id, NEW.arrival_date, NEW.departure_date, 'booked',
       'Auto-blocked from accepted hosting request', NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_hosting_request_blackout ON public.hosting_requests;
CREATE TRIGGER trg_sync_hosting_request_blackout
AFTER INSERT OR UPDATE OF status OR DELETE ON public.hosting_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_hosting_request_blackout();
