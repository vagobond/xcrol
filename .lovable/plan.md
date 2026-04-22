

## Notifications Cleanup + The World Stream

Four-way split of notifications, each living where its activity happens.

### Notification Streams

```
Bell icon          → Personal & social: friend requests, references, mentions,
                     river replies, brook activity, unread messages
Village icon       → All group activity: posts, comments, reactions in any group
                     you're a member of
World icon (Globe) → IRL Layer activity: new hometowns near you, hosting requests,
                     meetup requests, introduction requests
Forest (no badge)  → unchanged; introductions still show in Forest UI
```

### 1. "Show all / unread only" toggle

A small toggle at the top of every notification dropdown (Bell, Village, World):
- **Unread only** (default) — current behaviour
- **All recent** — also shows read items from the past 14 days, dimmed

Backend: extend `get_user_notifications` RPC with `p_include_read boolean default false` and `p_types text[] default null` (so each dropdown can scope to its own types). When `p_include_read=true`, return last 14 days regardless of `read_at`, capped at 50. A "Mark all as read" link appears in "All" mode.

### 2. Wire village notifications end-to-end

Today, comments and reactions inside a group never become DB rows for non-authors, and per-group views don't surface "new since last visit."

**Database migration — triggers on:**
- `group_posts` insert → notification type `group_post` for every group member except author
- `group_post_comments` insert → type `group_comment` for post author + previous commenters on that post
- `group_post_reactions` / `group_comment_reactions` → existing types, also notify post author if missing

**Frontend:**
- `useGroupActivity` & `useVillageActivityCount` — count comments & reactions since `last_visited_at`, not just posts
- `GroupProfile.tsx` — "X new since your last visit" pill at top of post list
- `VillageBadge` — total reflects all village types

### 3. Wire World notifications

New notification types written by triggers / existing flows:
- `nearby_hometown` — when a new user claims a hometown within ~200km of yours (trigger on `profiles.hometown_lat/lng` insert, finds nearby users via existing precision-rounded coords)
- `hosting_request` — already exists in `hosting_requests`; add trigger to write `notifications` row of type `hosting_request` to `to_user_id`
- `meetup_request` — same for `meetup_requests`
- `introduction_request` — same for `introduction_requests` (to introducer)

Add a small dropdown to the World icon (Globe) in `AppHeader` mirroring the Bell — uses the new `p_types` filter to pull only world types. Badge shows unread count.

### 4. Split the Bell

Modify `useNotifications` to partition by type into three buckets:
- `bellNotifications` — friend_request, friendship_pending, reference_received, river_reply, brook_*, mention, unread_message
- `villageNotifications` — group_post, group_comment, group_reaction, group_comment_reaction
- `worldNotifications` — nearby_hometown, hosting_request, meetup_request, introduction_request

Each consumer (Bell, VillageBadge, new WorldBadge) reads from its own bucket only. The Bell badge no longer includes village or world items.

### Files Touched

**Created:**
- `src/components/WorldBadge.tsx` (Globe icon + dropdown + count)
- One DB migration (RPC update + group + world triggers)

**Modified:**
- `src/hooks/use-notifications.ts` — partition, viewMode, type filtering
- `src/components/NotificationBell.tsx` — toggle UI, render only `bellNotifications`
- `src/components/VillageBadge.tsx` — toggle + render `villageNotifications` dropdown
- `src/components/AppHeader.tsx` — replace inline World button with `<WorldBadge />`
- `src/hooks/use-village-activity.ts` & `use-group-activity.ts` — count comments + reactions
- `src/pages/GroupProfile.tsx` — "X new since last visit" pill
- `src/lib/notification-resolver.ts` — handle `group_post`, `nearby_hometown`, `hosting_request`, `meetup_request`, `introduction_request` types

### Notes
- All additive — no existing flows broken
- 14-day "All" window keeps dropdowns bounded
- Respects existing `notify_group_activity` setting; adds `notify_world_activity` (default true) to user settings
- Hometown-proximity uses already-rounded coords; no new privacy exposure
- Bell, Village, and World share one toggle component for consistency

