-- Enforce the guest-count range at the database level.
--
-- max_guests was previously bounded only by client-side clamping in MySpaceTab,
-- so anything could be written via the API or a stale/modified client. The UI
-- mirrors these bounds via MIN_GUESTS / MAX_GUESTS in
-- src/pages/hearth-surfing/types.ts — keep the two in sync.
--
-- NULL is permitted: the column is nullable with DEFAULT 1, and readers already
-- coalesce it (`max_guests || 1`). Constraining NULL would break inserts that
-- legitimately omit the field.
--
-- Verified before writing: all existing rows in production hold values within
-- 1..10 and none are NULL, so this validates without a data repair step.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'hosting_preferences_max_guests_range'
      AND conrelid = 'public.hosting_preferences'::regclass
  ) THEN
    ALTER TABLE public.hosting_preferences
      ADD CONSTRAINT hosting_preferences_max_guests_range
      CHECK (max_guests IS NULL OR (max_guests >= 1 AND max_guests <= 10));
  END IF;
END $$;
