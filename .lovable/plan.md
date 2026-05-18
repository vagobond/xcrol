## Two small fixes

### 1) No back button from a group (e.g. The Inn) to The Village

`GroupHeader.tsx` renders only the title, member badge, and join/leave buttons. There is no link back to `/the-village`. Users have to use the browser back button or the header Village icon.

**Fix:** Add a small "Back to The Village" link/button at the top of `src/pages/GroupProfile.tsx` (above `GroupHeader`), styled to match the existing back button in `TheVillage.tsx` (`ArrowLeft` + "Back" ghost button). It should navigate to `/the-village` directly (not `navigate(-1)`), so it always lands on the Village index even if the user arrived via a notification deep-link.

### 2) Village notification count doesn't clear after viewing

The Village header badge shows `Math.max(villageBadgeCount, villageActivityCount)` (see `src/components/VillageBadge.tsx`):

- `villageBadgeCount` comes from `useNotifications` and clears when items are marked read.
- `villageActivityCount` comes from `useVillageActivityCount`, which counts group posts/comments newer than each membership's `last_visited_at`.

When the user clicks a Village notification:
- The deep-link opens `GroupProfile`, which updates that group's `last_visited_at` on the server.
- But `useVillageActivityCount` only re-fetches on: `village-visited` event, tab visibility change, or its 10-minute interval. Visiting a single group does **not** dispatch `village-visited`, so the activity count keeps showing the stale number until the user opens `/the-village` or 10 minutes pass.
- Result: the red badge "persists even after the thing has been checked."

A second contributor: `markInteractionRead` updates local state but does not trigger the activity-count refetch either.

**Fix:**

- In `src/pages/GroupProfile.tsx`, after the `recordVisit()` server update succeeds, `window.dispatchEvent(new Event("village-visited"))` so the activity-count hook recomputes immediately.
- In `src/hooks/use-notifications.ts` `markInteractionRead`, after the DB update, also dispatch `village-visited` when any of the marked notifications belong to `VILLAGE_TYPES`. This covers users who mark-read from the dropdown without navigating.
- (Optional, low-risk) In `useVillageActivityCount`, also refetch on a custom `group-visited` event for symmetry — not strictly required if we dispatch `village-visited` from `GroupProfile`.

No DB changes, no resolver changes, no new components.

## Files touched

- `src/pages/GroupProfile.tsx` — add Back-to-Village button; dispatch `village-visited` after `recordVisit`.
- `src/hooks/use-notifications.ts` — dispatch `village-visited` from `markInteractionRead` (and `markAllRead`) when village-type notifs are touched.

## Result

- Every group page has a clear "Back" affordance to The Village.
- Clicking a Village notification (or marking it read) immediately clears the red badge on the Village icon, instead of waiting for the next poll.
