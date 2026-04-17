-- 1. Add weekly digest preference to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS weekly_digest_enabled boolean NOT NULL DEFAULT true;

-- 2. Create weekly_digest_log table for idempotency
CREATE TABLE IF NOT EXISTS public.weekly_digest_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_number integer NOT NULL,
  year integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, week_number)
);

ALTER TABLE public.weekly_digest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own digest log"
ON public.weekly_digest_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_digest_log_user_year_week
ON public.weekly_digest_log(user_id, year, week_number);

-- 3. Enable realtime for xcrol_entries
ALTER TABLE public.xcrol_entries REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'xcrol_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.xcrol_entries;
  END IF;
END $$;