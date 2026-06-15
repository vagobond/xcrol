
ALTER TABLE public.hosting_preferences
  ADD COLUMN IF NOT EXISTS is_hosting_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activeness_probe_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_probe_token uuid;

CREATE INDEX IF NOT EXISTS idx_hosting_preferences_probe_token
  ON public.hosting_preferences(last_probe_token)
  WHERE last_probe_token IS NOT NULL;
