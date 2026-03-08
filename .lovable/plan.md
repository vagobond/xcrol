

## Bug: All Group Posts Showing as "New"

### Root Cause

The migration added `last_visited_at` to `group_members` defaulting to NULL. The code falls back to `created_at` (membership join date) when `last_visited_at` is NULL. For users who haven't visited every single group page since the migration deployed, the fallback date is their original join date — often weeks ago — so every post since then appears "new."

Only one user (the one who tested the feature) has any `last_visited_at` values set. All other members across all groups still have NULL.

### Fix

A single data migration to backfill `last_visited_at = now()` for all existing active members where it's currently NULL. This gives everyone a clean slate — no false "new" badges — and going forward the visit-recording logic will keep it updated correctly.

```sql
UPDATE public.group_members
SET last_visited_at = now()
WHERE status = 'active' AND last_visited_at IS NULL;
```

One migration, no code changes needed.

