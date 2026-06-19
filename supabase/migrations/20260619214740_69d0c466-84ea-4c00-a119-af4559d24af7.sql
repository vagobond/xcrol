ALTER TABLE public.hosting_preferences
  ADD COLUMN IF NOT EXISTS accepts_last_minute boolean NOT NULL DEFAULT false;

ALTER TABLE public.hosting_requests
  ADD COLUMN IF NOT EXISTS companions_note text;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS seeking_companions boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS buddy_note text;

CREATE INDEX IF NOT EXISTS trips_seeking_companions_idx
  ON public.trips(seeking_companions, end_date)
  WHERE seeking_companions = true;