## Cascade River reply visibility down the thread

Right now every River reply is gated to the author + their friends, regardless of whether the parent reply is visible. So if a friend of yours replies to a non-friend's visible reply, you can see your friend's name but not their content — even though they were responding to something you can already read.

### New rule
A reply's content is viewable to a viewer when **any** of these is true:
1. The viewer is the reply's author.
2. The viewer is a friend of the reply's author (current rule: levels `close_friend`, `buddy`, `friendly_acquaintance`, `family`, `secret_friend`).
3. **(new)** The reply has a `parent_reply_id`, and the viewer can view the parent reply's content (applied recursively up the chain).

Top-level replies (no parent) keep today's friend-only rule. Anonymous viewers (`p_viewer_id IS NULL`) keep seeing nothing — no behavior change for logged-out users.

### Where the change lives

Only the `get_river_replies(uuid[], uuid)` SQL function needs to change. Both `content` and `can_view_content` are computed there, and the frontend (`RiverReplies.tsx` / `RiverReplyItem.tsx`) already renders correctly based on `can_view_content` — no UI work needed.

### Technical sketch

Rewrite the function using a recursive CTE that walks each reply up to its top-level ancestor, then marks the reply visible if any node in that chain passes the friend check (or is authored by the viewer):

```text
WITH RECURSIVE chain AS (
  -- start: each reply with viewer-vs-author check
  SELECT r.id AS leaf_id, r.id AS node_id, r.user_id, r.parent_reply_id,
         (r.user_id = viewer
          OR EXISTS friendship(viewer -> r.user_id)) AS visible_here
  FROM river_replies r
  WHERE r.entry_id = ANY(entry_ids)
  UNION ALL
  SELECT c.leaf_id, p.id, p.user_id, p.parent_reply_id,
         (p.user_id = viewer
          OR EXISTS friendship(viewer -> p.user_id))
  FROM chain c
  JOIN river_replies p ON p.id = c.parent_reply_id
)
SELECT leaf_id, BOOL_OR(visible_here) AS can_view
FROM chain GROUP BY leaf_id;
```

Then the outer SELECT joins this aggregate back onto `river_replies` to populate `content` (NULL when `can_view = false`) and `can_view_content`. Signature, return columns, ordering, and `SECURITY DEFINER` + `search_path = public` settings stay identical so the existing `supabase.rpc("get_river_replies", …)` calls and TypeScript types keep working.

### Out of scope

- No change to `river_replies` RLS (it already lets everyone select rows; the function masks content).
- No change to group post comments — they're already member-gated, not friend-gated.
- No new column or "public" flag is introduced; visibility remains derived.
