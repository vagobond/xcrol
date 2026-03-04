

## Fix: "Failed to Update Reaction" on River Reply Reactions

### Root Cause

The bug is a **race condition** in the `RiverReplyReactions` component. Here's the sequence:

1. Component mounts and starts two parallel async operations:
   - Fetching the current user via `supabase.auth.getUser()` (sets `userId`)
   - Loading reactions via `loadReactions()` (triggered by `useEffect`)
2. `loadReactions` often runs **before** `userId` is set. Since `userId` is `null`, all reactions load with `hasReacted: false` — even if the current user has already reacted.
3. When `userId` resolves, `loadReactions` runs again, but if the user clicks the ❤️ emoji **before** the second load completes, `toggleReaction` reads stale state where `hasReacted = false`.
4. The code thinks the user hasn't reacted and tries to INSERT, but the reaction already exists in the database → **unique constraint violation** → "Failed to update reaction" toast.
5. The optimistic update showed the heart, but the catch block calls `loadReactions()` which reverts the state. The net result is confusing: toast error, heart might flash, and on refresh the reaction is either missing (if an earlier attempt truly failed) or present (if a retry succeeded).

The same race condition pattern exists in `BrookReactions` (though it gets `currentUserId` as a prop, avoiding this specific issue) but `XcrolReactions` and `GroupPostReactions` have the identical bug since they also fetch `userId` internally.

### Fix (3 files)

**Strategy**: Use `upsert` with `onConflict` instead of `insert` for adding reactions, and add `{ count: 'exact' }` or simply ignore the unique constraint error. The simplest and most robust fix is to:

1. **Use `upsert` instead of `insert`** for reaction creation — this gracefully handles the case where the reaction already exists (it becomes a no-op).
2. **Ignore "duplicate key" errors on insert** as a secondary guard — if the reaction already exists, that's actually the desired state.

#### File 1: `src/components/river/RiverReplyReactions.tsx`
- Line ~136: Change `.insert(...)` to `.upsert(..., { onConflict: 'reply_id,user_id,emoji' })`

#### File 2: `src/components/XcrolReactions.tsx`
- Line ~201: Change `.insert(...)` to `.upsert(..., { onConflict: 'entry_id,user_id,emoji' })`

#### File 3: `src/components/group/GroupPostReactions.tsx`
- Line ~143 (post reactions): Change `.insert(...)` to `.upsert(..., { onConflict: 'post_id,user_id,emoji' })`
- Line ~147 (comment reactions): Change `.insert(...)` to `.upsert(..., { onConflict: 'comment_id,user_id,emoji' })`

### What does NOT change
- No styling or UI changes
- No database migrations or RLS policy changes
- No changes to the delete path (removing reactions)
- No changes to the optimistic update logic
- `BrookReactions` is not affected (it receives `currentUserId` as a prop, avoiding the race)
- All other reaction behavior remains identical

