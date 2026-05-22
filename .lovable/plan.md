## Problem

`get_river_entries` orders posts by `entry_date DESC, created_at DESC`. `entry_date` is a `date` computed in the poster's hometown timezone, so a user 10 hours ahead of UTC gets a later `entry_date` and is ranked above a post actually written afterwards by someone west. Ed's report is correct.

## Fix

Change ordering in `get_river_entries` to use the true UTC creation timestamp instead of the localized `entry_date`. `entry_date` stays in the SELECT so it still displays as the poster's local date label — only the sort key changes.

### Branches to update

1. **`p_filter = 'public'`** and **else (level filters)** branch
   - Replace `ORDER BY e.entry_date DESC, e.created_at DESC` with `ORDER BY e.created_at DESC`.

2. **`p_filter = 'all'` (UNION with RSS)** branch
   - Add a unified `sort_at timestamptz` column to each side of the UNION:
     - xcrol side: `e.created_at`
     - rss side: `ri.published_at`
   - Replace `ORDER BY entry_date DESC` with `ORDER BY sort_at DESC`.
   - `sort_at` is selected internally for ordering; the RETURNS TABLE signature is unchanged (wrap UNION in an outer SELECT that drops `sort_at`, or use a subquery).

3. **`p_filter = 'rss'`** branch already orders by `published_at DESC` — leave as is.

### Migration

Single `CREATE OR REPLACE FUNCTION public.get_river_entries(...)` migration with the above three changes. No schema changes, no RLS changes, no frontend changes.

### Out of scope

- Display formatting of `entry_date` (still shown as poster's local date — intended).
- `get_river_replies`, group posts, brook posts — only the River feed sort was reported.
- The 1-post-per-day rule (still keyed off hometown `entry_date`, which is correct per existing memory).