

## Group Activity Notifications (Red Dot Badges)

### Overview

Add red dot notification badges with counts to group cards on The Village page, showing new posts since the user's last visit. Inside a group, show new comment indicators on individual posts. All counts reset when the user leaves the group page.

### Approach: Client-Side "Last Visited" Tracking

Rather than adding a database table, this uses **localStorage** to track the last time a user visited each group. This is lightweight, requires no database migration, no new RLS policies, and keeps the feature entirely client-side.

- `localStorage` key pattern: `group_last_visit_{groupId}` storing an ISO timestamp
- On entering a group page, record the current timestamp when leaving (via `useEffect` cleanup or `beforeunload`)
- On The Village page, compare each group's latest post timestamp against the stored last-visit timestamp

### Changes

#### 1. New hook: `src/hooks/use-group-activity.ts`

A custom hook that:
- Accepts the list of groups the user is a member of
- For each group, queries `group_posts` to count posts with `created_at` after the stored `localStorage` timestamp
- Returns a `Map<groupId, newPostCount>`
- Uses a single batched query (fetch recent posts for all member group IDs, then count client-side)

#### 2. Update `src/pages/TheVillage.tsx`

- Import and use the new hook
- Pass `newPostCount` to `GroupCard`
- Render a red dot badge on the group avatar when `newPostCount > 0`

#### 3. Update `src/pages/GroupProfile.tsx`

- On mount, read the last-visit timestamp from localStorage for this group
- Pass it to `GroupPostsTab` as `lastVisitedAt`
- On unmount (or route change), update localStorage with current timestamp -- this dismisses notifications

#### 4. Update `src/components/group/GroupPostsTab.tsx`

- Accept `lastVisitedAt` prop
- For each post, if `created_at > lastVisitedAt`, show a subtle "New" badge
- For comments on each post, pass `lastVisitedAt` to `GroupPostComments`

#### 5. Update `src/components/group/GroupPostComments.tsx`

- Accept optional `lastVisitedAt` prop
- Show count of new comments (those with `created_at > lastVisitedAt`) as a small indicator next to the comment count

#### 6. Red dot badge styling

- Small red circle with white number, positioned on the top-right corner of the group avatar on The Village page
- Uses absolute positioning within a `relative` container
- Consistent with common notification badge patterns

### Technical Details

**Why localStorage instead of a database table:**
- No migration needed, no RLS policies to manage
- Instant reads/writes with no network latency
- Per-device tracking is acceptable here (notifications are a convenience, not critical data)
- If a user clears localStorage, they simply see all posts as "new" once -- harmless

**Query efficiency:**
- The Village page makes one query: fetch the `MAX(created_at)` from `group_posts` grouped by `group_id` for the user's member groups
- Inside a group, the existing posts query already fetches all posts -- no extra query needed, just client-side filtering against the timestamp

**Dismissal behavior:**
- Timestamp is written to localStorage when the user **leaves** the group page (useEffect cleanup)
- This means while browsing the group, new post badges remain visible
- On next visit to The Village, the counts will reflect only activity after the last departure

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/use-group-activity.ts` | New hook for fetching unread post counts per group |
| `src/pages/TheVillage.tsx` | Add red dot badges to GroupCard |
| `src/pages/GroupProfile.tsx` | Record last-visit timestamp on unmount, pass to posts tab |
| `src/components/group/GroupPostsTab.tsx` | Add "New" indicators on posts since last visit |
| `src/components/group/GroupPostComments.tsx` | Add new comment count indicator |

