
# Diagnostics pass — what I already found and what's left to do

## TL;DR up front
Good news: I did **not** drop, rename, or alter any tables. The schema is intact and the latest nightly backup (2026-06-10) succeeded with **zero errors** and dumped 66 tables including the ones you flagged.

The earlier "table doesn't exist" noise was a **naming-list bug in the old verify_restore manifest**, not real missing tables. The real tables are alive and populated:

| Earlier (wrong) name in stale manifest | Actual table | Current rows |
|---|---|---|
| `friendship_requests` | `friend_requests` | 36 |
| `blocked_users` | `user_blocks` | 0 (table exists, just empty) |
| `references` | `user_references` | 25 |
| `group_join_requests` | *never existed* — joins go through `group_members` + `groups.requires_approval` | — |
| `group_visits` | *never existed* — Village activity uses `group_members.last_visited_at` | — |

The KNOWN_TABLES list inside `supabase/functions/nightly-backup/index.ts` already uses the correct names, which is why the most recent backup ran clean.

## What I want to verify next (this is the actual diagnostic work)

### 1. Confirm no recent migration broke River reads/writes
The most recent schema change is `20260605220915_*.sql` (June 5). It **revoked broad SELECT on `public.profiles`** and re-granted SELECT only on a fixed column list (id, display_name, avatar_url, bio, link, username, created_at, updated_at, invite_verified, nostr_npub, nostr_handle, hometown_city/country/latitude/longitude/description, last_hometown_change). Sensitive PII now flows only through `get_own_profile()` / `get_visible_profile()` security-definer functions.

This is the most likely culprit for "River came up empty" / "entry failed to save" because:
- `TheRiver.tsx`'s realtime handler does `from("profiles").select("display_name, avatar_url, username")` — those are allowed, should be fine.
- But ~40 other call sites still do `from("profiles").select(...)` and some may request columns that are no longer granted (e.g. `email`, `birthday`, anything not in the re-grant list). Any such call returns a 403, the surrounding component throws/swallows, and downstream UI looks empty.

**Action:** grep every `from("profiles").select(...)` call in `src/`, diff the requested columns against the granted column list, and produce a list of any call site that asks for a now-revoked column. Fix each one by routing through `get_visible_profile()` RPC instead (the pattern the migration set up).

### 2. Check the analytics logs for the actual failure window
Pull Supabase analytics for June 10–11:
- `function_edge_logs` for any 4xx/5xx
- `postgres_logs` for permission-denied errors against `profiles` or `xcrol_entries`
- `auth_logs` for any spike in re-auth or session loss

This will either confirm the profile-column theory or surface something else (network, realtime channel drops, etc.).

### 3. Verify River insert path is intact
`XcrolEntryForm.tsx` inserts into `xcrol_entries` then refetches profile. Trace whether the refetch column list is in the granted set; if not, the save technically succeeds in the DB but the optimistic UI update fails and the user sees "save failed." Row counts confirm the DB writes are happening (2 entries on June 10), so this is consistent with a UI-level "save failed" toast triggered by the post-insert profile fetch, not a real DB rejection.

### 4. Quick health sweep
- `db_health` snapshot (connection saturation, OOM, deadlocks)
- `slow_queries` top 10 (in case `get_river_entries` regressed)
- Re-run nightly backup once manually to confirm it still hits 0 errors

## Files I expect to touch (only if step 1 finds problems)
- Any `src/**` file selecting now-revoked profile columns → switch the column list or move to `supabase.rpc("get_visible_profile", ...)`
- No migrations
- No edge functions
- No backup/restore code

## Out of scope
- BYOK AI changes (already shipped, untouched)
- Backup/restore plumbing (verified green)
- Wayfarer+ entitlement work (parked for the next round)

## Deliverable
A short written report listing: (a) every call site I checked, (b) which ones were broken and how I fixed them, (c) what the logs say actually happened on June 10–11, and (d) confirmation that River load + entry save both work end-to-end in the preview after the fixes.
