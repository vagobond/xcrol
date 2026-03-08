

## Add Notification Badge to Village Icon in AppHeader

### Goal
Show a red badge on the Village icon in the header nav bar when there is new activity (posts) in groups the user has joined. This is independent of the bell icon notifications, which handle reactions/comments/mentions on the user's own content.

### Approach

**New hook: `src/hooks/use-village-activity.ts`**
A lightweight hook that:
1. Fetches the current user's active group memberships (just group IDs)
2. For each group, reads the `group_last_visit_{groupId}` timestamp from localStorage (reusing the existing convention from `use-group-activity.ts`)
3. Queries `group_posts` to count posts newer than each group's last-visit timestamp
4. Returns a single total number (sum across all groups)

This reuses the same localStorage-based tracking already in place — no database changes needed.

**Modified file: `src/components/AppHeader.tsx`**
- Import and call `useVillageActivityCount`
- Wrap the Village `<Button>` in a `relative` container
- When count > 0, render a small red badge (same styling as NotificationBell) on the Village icon

### Technical Detail

```text
AppHeader Village button:
  <Button className="relative ...">
    <img ... />
    {count > 0 && <span className="absolute -top-1 -right-1 ...">count</span>}
  </Button>
```

The hook query:
```typescript
// 1. Get user's active group memberships
const { data } = await supabase
  .from("group_members")
  .select("group_id")
  .eq("user_id", userId)
  .eq("status", "active");

// 2. For each group, check localStorage last-visit vs group_posts created_at
// 3. Sum up new posts across all groups
```

### Files
- **New**: `src/hooks/use-village-activity.ts`
- **Modified**: `src/components/AppHeader.tsx` (add badge to Village button)

### What does NOT change
- No database migrations or RLS changes
- No changes to the bell icon / NotificationBell component
- No changes to the existing `use-group-activity.ts` hook (TheVillage page continues using it for per-group badges)
- No changes to localStorage conventions

