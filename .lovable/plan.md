

## Fix Sticky Village Notifications

### Root Cause

The village badge count never clears because `last_visited_at` is only updated when a user opens a **specific group** (GroupProfile.tsx line 67). Visiting the Village listing page (`/the-village`) does NOT update any group's `last_visited_at`, so the badge stays permanently until the user clicks into every individual group.

### What Broke It

This was always the behavior — it wasn't "broken" by a recent change. The village badge was designed to count unread posts per-group, but the only place that resets the counter is inside GroupProfile. The badge works correctly for showing "there's new stuff," but has no mechanism for bulk-clearing when a user visits the Village overview.

### Fix

**1. Update `TheVillage.tsx`** — When the Village page mounts, update `last_visited_at` to `now()` for ALL of the user's active group memberships. This clears the badge when the user visits the Village listing.

Add a `useEffect` that runs on mount:
```ts
useEffect(() => {
  if (!user?.id) return;
  supabase
    .from("group_members")
    .update({ last_visited_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("status", "active")
    .then(() => {
      // Dispatch event so VillageBadge re-checks
      window.dispatchEvent(new Event("village-visited"));
    });
}, [user?.id]);
```

**2. Update `use-village-activity.ts`** — Listen for a `village-visited` custom event to immediately re-fetch (which will now return 0 since all `last_visited_at` values were just updated).

Add inside the `useEffect`:
```ts
const handleVillageVisited = () => { if (!cancelled) fetchCount(); };
window.addEventListener("village-visited", handleVillageVisited);
// cleanup: window.removeEventListener("village-visited", handleVillageVisited);
```

### What Won't Break

- GroupProfile still updates `last_visited_at` per-group on its own (unchanged)
- Per-group "New" badges inside TheVillage and GroupProfile still work — `useGroupActivity` reads the same `last_visited_at` field, but those badges are fetched fresh on each page load
- NotificationBell is completely separate — it reads from the `notifications` table, not `group_members.last_visited_at`
- The individual group activity counts (`useGroupActivity`) will show 0 after visiting TheVillage, which is correct behavior (you've "seen" the village)

### Files Changed
- **Edit** `src/pages/TheVillage.tsx` — add useEffect to bulk-update `last_visited_at`
- **Edit** `src/hooks/use-village-activity.ts` — listen for `village-visited` event

