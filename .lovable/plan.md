## Where your ~1.2 credits/day on the database is going

From the workspace ledger (Jun 15–22):

| Item | Credits | Notes |
|---|---|---|
| Cloud compute pico | **4.90** | The database instance itself — ~0.7/day. This is the big one. |
| Cloud egress | 0.081 | Data sent to browsers |
| Cloud cached egress | 0.015 | |
| Cloud functions | 0.011 | Edge functions |
| Cloud file storage | 0.0016 | |
| Cloud realtime | 0.00004 | |

So "database cost" is almost entirely the **always-on compute instance** (pico tier). It is billed for being up, not per query — but if query load forces a bigger instance, this number jumps. Right now the instance is healthy (memory 54%, disk 4%, 21/60 connections), so you do not need to upsize. The goal is to **keep it on pico** by stopping a few runaway queries before traffic grows.

## What's hammering the DB

Top offenders from `pg_stat_statements` (last ~week):

1. **Mark-message-read UPDATE** — 193,365 calls, 147 s total. One row at a time.
2. **Unread messages SELECT** (`to_user_id = ? AND read_at IS NULL`) — 278,410 calls, 18 s total. This is the inbox badge poller.
3. **Unread messages SELECT (id only)** — 2,122 calls, 6.7 s. Same pattern.
4. **Profiles by id ANY(...)** — 13,669 + 17,643 calls, 26 s combined. Repeated avatar/name lookups in feeds.
5. **xcrol_entries feed ORDER BY entry_date DESC, created_at DESC** — 1,196 calls, 11.7 s. No matching index.
6. **xcrol_reactions / group_post_reactions / group_post_comments / group_comment_reactions by parent id** — 50k+ calls combined. Likely missing or unused indexes on the FK columns.
7. **user_references by to_user_id + created_at** — 6.6k calls, 6.2 s.
8. **profiles scan for `hometown_city IS NOT NULL`** — 1,096 calls, 6.4 s. Used by the world map.

Together those few patterns are ~80% of DB CPU time.

## Plan to lower cost

### 1. Stop the unread-messages polling storm (biggest win)
The inbox badge query + per-row `UPDATE ... SET read_at` accounts for **~470k calls/week**. Likely causes: a `setInterval` refetch and marking each message individually as it scrolls into view.

- Switch the unread badge to a single Supabase **Realtime** subscription on `messages` filtered by `to_user_id`, or at minimum lower the poll interval to ≥60s and use `count: 'exact', head: true` (no row payload).
- Batch read receipts: one `UPDATE messages SET read_at = now() WHERE to_user_id = me AND id IN (...)` per thread open, not per message.

### 2. Add targeted indexes (cheap, fast wins)

```sql
CREATE INDEX IF NOT EXISTS idx_messages_unread_to
  ON public.messages (to_user_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_xcrol_entries_feed
  ON public.xcrol_entries (entry_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xcrol_reactions_entry
  ON public.xcrol_reactions (entry_id);
CREATE INDEX IF NOT EXISTS idx_group_post_reactions_post
  ON public.group_post_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_group_post_comments_post_created
  ON public.group_post_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_group_comment_reactions_comment
  ON public.group_comment_reactions (comment_id);
CREATE INDEX IF NOT EXISTS idx_user_references_to_created
  ON public.user_references (to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_user_status
  ON public.group_members (user_id, status);
CREATE INDEX IF NOT EXISTS idx_profiles_hometown_country
  ON public.profiles (hometown_country) WHERE hometown_city IS NOT NULL;
```

Tradeoff: tiny extra storage, slightly slower writes on these tables — negligible at current volumes.

### 3. Cache profile lookups on the client
The `profiles WHERE id = ANY(...)` queries fire from every feed render. Use a single React Query cache keyed by user id with a long staleTime (e.g. 5 min) so the same author's row is not re-fetched per post component.

### 4. Investigate the 69,525 rolled-back transactions
That number is high for a quiet app and usually means an RLS-denied write loop or a failing trigger retrying. After the messages fix lands I'll check edge function and Postgres logs to see what's rolling back.

### What this will NOT do
This will not directly shrink the pico compute line item — that bill stays the same as long as the instance is up. What it does is prevent the next traffic bump from forcing an upgrade to a larger (more expensive) instance.

## Technical notes
- All migrations go through the standard migration tool; no concurrent index creation.
- Realtime is already enabled (you have a Cloud realtime line item, just unused for this).
- No schema-breaking changes; safe to roll back any index with `DROP INDEX`.
