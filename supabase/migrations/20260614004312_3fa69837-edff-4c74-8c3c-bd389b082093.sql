
-- 1. Add stay-tied columns to user_references
ALTER TABLE public.user_references
  ADD COLUMN IF NOT EXISTS hosting_request_id uuid REFERENCES public.hosting_requests(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS revealed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_references_hosting_request
  ON public.user_references(hosting_request_id)
  WHERE hosting_request_id IS NOT NULL;

-- 2. Replace unique constraint with partial unique indexes
ALTER TABLE public.user_references
  DROP CONSTRAINT IF EXISTS user_references_from_user_id_to_user_id_reference_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS user_references_unique_non_stay
  ON public.user_references(from_user_id, to_user_id, reference_type)
  WHERE hosting_request_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_references_unique_stay
  ON public.user_references(from_user_id, to_user_id, hosting_request_id)
  WHERE hosting_request_id IS NOT NULL;

-- 3. Trigger: when both counterparts exist for a hosting_request, reveal both
CREATE OR REPLACE FUNCTION public.maybe_reveal_stay_references()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.hosting_request_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_references
    WHERE hosting_request_id = NEW.hosting_request_id
      AND from_user_id = NEW.to_user_id
      AND to_user_id = NEW.from_user_id
      AND id <> NEW.id
  ) THEN
    UPDATE public.user_references
      SET revealed_at = now()
      WHERE hosting_request_id = NEW.hosting_request_id
        AND revealed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_maybe_reveal_stay_references ON public.user_references;
CREATE TRIGGER trg_maybe_reveal_stay_references
AFTER INSERT ON public.user_references
FOR EACH ROW EXECUTE FUNCTION public.maybe_reveal_stay_references();

-- 4. Update SELECT policies so unrevealed stay refs (<14d old) are hidden from third parties
DROP POLICY IF EXISTS "Users can view references" ON public.user_references;
DROP POLICY IF EXISTS "Users can read references for connected users" ON public.user_references;

CREATE POLICY "Users can read references for connected users"
ON public.user_references
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND is_within_three_degrees(auth.uid(), to_user_id)
  AND (
    hosting_request_id IS NULL
    OR revealed_at IS NOT NULL
    OR created_at < now() - interval '14 days'
    OR auth.uid() = from_user_id
    OR auth.uid() = to_user_id
  )
);

CREATE POLICY "Users can view references"
ON public.user_references
FOR SELECT
USING (
  NOT is_blocked(from_user_id, auth.uid())
  AND NOT is_blocked(to_user_id, auth.uid())
  AND NOT is_blocked(auth.uid(), from_user_id)
  AND NOT is_blocked(auth.uid(), to_user_id)
  AND (
    hosting_request_id IS NULL
    OR revealed_at IS NOT NULL
    OR created_at < now() - interval '14 days'
    OR auth.uid() = from_user_id
    OR auth.uid() = to_user_id
  )
);

-- 5. Private safety feedback table (admin + writer only)
CREATE TABLE IF NOT EXISTS public.private_stay_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hosting_request_id uuid NOT NULL REFERENCES public.hosting_requests(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.private_stay_feedback TO authenticated;
GRANT ALL ON public.private_stay_feedback TO service_role;

ALTER TABLE public.private_stay_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Writers can insert private feedback"
ON public.private_stay_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Writers can view their own private feedback"
ON public.private_stay_feedback
FOR SELECT
USING (auth.uid() = from_user_id);

CREATE POLICY "Admins can view all private feedback"
ON public.private_stay_feedback
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete private feedback"
ON public.private_stay_feedback
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_private_stay_feedback_hosting_request
  ON public.private_stay_feedback(hosting_request_id);
