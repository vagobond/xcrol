

## Fix: Exclude own posts from Village activity counts

Both `use-village-activity.ts` and `use-group-activity.ts` count **all** new posts in groups, including the current user's own posts. The fix is simple: add `.neq("user_id", user.id)` to the `group_posts` query in both hooks.

### Changes

**1. `src/hooks/use-village-activity.ts`**
- Add `user_id` to the select columns
- Add `.neq("user_id", user.id)` filter to exclude the current user's posts from the query

**2. `src/hooks/use-group-activity.ts`**
- Add `.neq("user_id", user.id)` filter to exclude the current user's posts from the query

Both changes are single-line additions to the existing database queries. No schema or RLS changes needed.

