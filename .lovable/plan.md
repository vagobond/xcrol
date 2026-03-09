

## Performance Issues Found

After reviewing the codebase, here are the issues identified and proposed fixes:

### 1. `select("*")` in AuditLogTab (medium priority)
`src/components/admin/AuditLogTab.tsx` line 130 uses `select("*")` on the `audit_log` table. Should use explicit columns: `select("id, event_type, actor_id, target_id, target_type, metadata, created_at")`.

### 2. `select("*")` in use-unread-messages (low priority)
`src/hooks/use-unread-messages.ts` line 34 uses `select("*", { count: "exact", head: true })`. Since `head: true` means no rows are returned, this is functionally fine but should use `select("id", { count: "exact", head: true })` for consistency and to avoid issues if `head` behavior changes.

### 3. `select("*")` in BrookComments (low priority)
`src/components/BrookComments.tsx` line 57 uses `select("*", { count: "exact", head: true })`. Same as above -- should use `select("id", { count: "exact", head: true })`.

### 4. Village activity polling runs even when user navigates away from Village
The `useVillageActivityCount` hook in `AppHeader` polls every 60 seconds for all authenticated users on every page. This is acceptable for a badge counter but could be optimized to poll less frequently (e.g., 5 minutes instead of 1 minute) since the badge is a soft indicator, not real-time critical.

### 5. No memoization on `memberGroupIds.join(",")` dependency in use-group-activity
`src/hooks/use-group-activity.ts` uses `memberGroupIds.join(",")` as a useEffect dependency. This is a valid pattern but the string is recreated on every render. This is minor.

---

### Proposed Changes

**Files to modify:**

1. **`src/components/admin/AuditLogTab.tsx`** -- Replace `select("*")` with explicit column list.

2. **`src/hooks/use-unread-messages.ts`** -- Replace `select("*", ...)` with `select("id", ...)`.

3. **`src/components/BrookComments.tsx`** -- Replace `select("*", ...)` with `select("id", ...)`.

4. **`src/hooks/use-village-activity.ts`** -- Increase polling interval from 60 seconds to 300 seconds (5 minutes) to reduce unnecessary network traffic.

All changes are single-line edits with no schema or architectural impact.

