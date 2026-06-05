
CREATE TABLE public.backup_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('nightly','weekly_source','heartbeat','manual')),
  status text NOT NULL CHECK (status IN ('running','success','failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  bytes_uploaded bigint NOT NULL DEFAULT 0,
  files_uploaded integer NOT NULL DEFAULT 0,
  tables_dumped integer NOT NULL DEFAULT 0,
  manifest_key text,
  error text,
  notes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.backup_runs TO authenticated;
GRANT ALL ON public.backup_runs TO service_role;

ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;

-- Admins only can view backup history
CREATE POLICY "Admins can view backup runs"
  ON public.backup_runs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserts/updates go through service role only (edge functions)
CREATE INDEX idx_backup_runs_started_at ON public.backup_runs (started_at DESC);
CREATE INDEX idx_backup_runs_kind ON public.backup_runs (kind, started_at DESC);
