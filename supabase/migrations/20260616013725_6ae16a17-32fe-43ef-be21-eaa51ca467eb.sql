
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_city text,
  destination_country text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  purpose text,
  companions text,
  visibility text NOT NULL DEFAULT 'friends',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trips_visibility_check CHECK (visibility IN ('private','friends','public')),
  CONSTRAINT trips_dates_check CHECK (end_date >= start_date)
);

CREATE INDEX idx_trips_user ON public.trips(user_id);
CREATE INDEX idx_trips_dates ON public.trips(start_date, end_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_owner_all" ON public.trips
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trips_public_read" ON public.trips
  FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM public.user_blocks b
      WHERE (b.blocker_id = trips.user_id AND b.blocked_id = auth.uid())
         OR (b.blocker_id = auth.uid() AND b.blocked_id = trips.user_id)
    )
  );

CREATE POLICY "trips_friends_read" ON public.trips
  FOR SELECT TO authenticated
  USING (
    visibility = 'friends'
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = trips.user_id)
         OR (f.friend_id = auth.uid() AND f.user_id = trips.user_id)
    )
  );

CREATE POLICY "trips_admin_read" ON public.trips
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.hosting_requests
  ADD COLUMN trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL;

CREATE INDEX idx_hosting_requests_trip ON public.hosting_requests(trip_id) WHERE trip_id IS NOT NULL;
