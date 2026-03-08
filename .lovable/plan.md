

## Village "New Post" Badge Bug Report — Root Cause Analysis

### How It Works Today

The system stores a `group_last_visit_{groupId}` timestamp in **localStorage** when a user leaves a group page. Posts created after that timestamp are flagged "New." There is no server-side tracking — everything depends on the browser's localStorage.

### Three Distinct Bugs Found

**Bug 1: localStorage is per-device — phone and desktop diverge**

Each device has its own localStorage. If the user last visited a group on desktop 2 hours ago but on their phone 7 days ago (or never), the phone will flag everything from the last 7 days as new. This fully explains the "different counts on phone vs desktop" report.

**Bug 2: Inconsistent handling of "never visited" groups**

There's a logic contradiction between the two activity hooks:

- `use-village-activity.ts` (header badge): treats groups with **no** localStorage entry as "all posts are new" — `if (!lastVisit || post > lastVisit) { total++ }`
- `use-group-activity.ts` (per-group card badges): treats groups with **no** localStorage entry as "0 new posts" — `if (!lastVisit) continue`

So the header can show 25 while individual group cards show 0. If the user's phone has cleared localStorage (which mobile browsers do under storage pressure), the header counts every post across every group as new.

**Bug 3: Mobile PWA doesn't reliably save the last-visit timestamp**

The timestamp is saved via `visibilitychange` and `pagehide` events, plus React's cleanup function. On mobile PWAs, none of these fire reliably when:
- The user swipes the app away
- The OS kills the PWA in the background
- The user navigates via the back gesture

If the timestamp never saves, the next visit still uses the old (or missing) timestamp, so everything appears new again — even posts viewed "many times."

### Recommended Fix

Move from localStorage to a **server-side `last_visited_at` column** on the `group_members` table. This would:
- Sync across devices (fixes Bug 1)
- Provide a consistent default — joined-at date for never-visited groups (fixes Bug 2)  
- Be saved via an API call on group page load rather than relying on unreliable browser lifecycle events (fixes Bug 3)

**Implementation outline:**

1. **Migration**: Add `last_visited_at timestamptz` column to `group_members` (default null, meaning "never visited — use `created_at` as fallback")
2. **Update on visit**: When `GroupProfile` mounts with a valid group, fire an upsert: `UPDATE group_members SET last_visited_at = now() WHERE group_id = X AND user_id = Y`
3. **Fetch counts**: Both `useGroupActivity` and `useVillageActivityCount` query `group_members.last_visited_at` instead of localStorage
4. **Remove localStorage**: Delete all `getGroupLastVisit`/`setGroupLastVisit` usage and the custom event wiring
5. **"New" badge in posts tab**: Pass `last_visited_at` from the server instead of reading from localStorage on mount

### Files Affected
- **Migration**: Add `last_visited_at` to `group_members`
- **Modified**: `src/hooks/use-group-activity.ts` — rewrite to query server
- **Modified**: `src/hooks/use-village-activity.ts` — rewrite to query server  
- **Modified**: `src/pages/GroupProfile.tsx` — save visit server-side on mount, remove lifecycle listeners
- **Modified**: `src/components/group/GroupPostsTab.tsx` — no structural change, just receives server timestamp

