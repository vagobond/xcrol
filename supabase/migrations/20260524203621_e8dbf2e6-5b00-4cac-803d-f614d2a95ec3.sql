CREATE TABLE IF NOT EXISTS public.scroll_ai_usage (
  user_id uuid NOT NULL,
  day date NOT NULL,
  action text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day, action)
);

ALTER TABLE public.scroll_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own scroll_ai_usage"
  ON public.scroll_ai_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);