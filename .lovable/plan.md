## Why the Village reply notification "disappeared"

Two compounding bugs make a Village reply effectively invisible after clicking the notification:

1. **`GroupProfile` ignores deep-link params.** The notification resolver already builds a rich URL like `/group/{slug}?post={postId}&comment={commentId}`, but `src/pages/GroupProfile.tsx` never reads `useSearchParams`. It just renders the Posts tab with the default 2-comment collapse. If the new comment is the 3rd+ on a post, it stays hidden behind "Show N more comments" and there is no scroll or highlight, so the user sees nothing changed.

2. **`TheVillage` page bulk-clears every group's `last_visited_at`.** The effect in `src/pages/TheVillage.tsx` runs on every mount and updates `last_visited_at = now()` for **all** active memberships. So if the user opens The Village (or it's preloaded) before entering the group, every per-post "New" badge inside the group is wiped out. Combined with bug #1, the reply has no visual marker anywhere.

A third minor issue: clicking through from the dropdown lands on the Posts tab, but the "new" badge on the parent comment count (in `GroupPostComments`) only counts comments newer than the captured `lastVisitedAt`. Once #2 is fixed it works, but we should also make sure the targeted comment is always rendered regardless of the collapse state.

## Fix

### 1. Stop bulk-clearing village badges from the list page
File: `src/pages/TheVillage.tsx`

Remove the `useEffect` that updates `last_visited_at` for every membership. The village badge in the header should clear based on **visiting individual groups**, not on opening the index. The `useGroupActivity` hook already derives the per-group counts from each membership's `last_visited_at`, and `GroupProfile` already updates its own row on visit — that's the correct source of truth.

If we still want the global village bell to clear when the list is opened, do it client-side only: dispatch the existing `village-visited` event so the header badge hides locally, but do **not** write to the DB. Per-group "New" markers then survive until the user actually opens that group.

### 2. Make `GroupProfile` deep-link aware
File: `src/pages/GroupProfile.tsx`

- Read `useSearchParams()` and pull `post` and `comment`.
- Pass them down to `GroupPostsTab` as `focusPostId` / `focusCommentId` props.
- Force the `Tabs` `defaultValue` to `"posts"` whenever a `post` param is present (already the default, but keep explicit).

File: `src/components/group/GroupPostsTab.tsx`

- Accept the two new props and pass them to `GroupPostComments` for the matching post.
- For the focused post: add a `ref`, scroll into view on mount, and apply a temporary `ring-2 ring-primary` highlight that fades after ~3s.

File: `src/components/group/GroupPostComments.tsx`

- Accept `focusCommentId` prop.
- On load, if the focused comment exists in the loaded list:
  - Force `expanded = true` so the full thread renders (bypass the 2-comment collapse).
  - Scroll the comment's row into view and apply the same temporary primary ring highlight.
- If the focused comment isn't in the initial fetch (e.g., very recent), keep the existing query — `loadComments` already pulls all comments for the post, so this should be sufficient.

### 3. Resolver: keep route shape, no change needed
`src/lib/notification-resolver.ts` already emits `?post=…&comment=…` for `group_comment`/`group_comment_reaction` — leave as-is.

### 4. Optional polish (small, additive)

- In `GroupPostComments`, when a `focusCommentId` is passed, auto-show the input area off (don't open the textarea) but ensure the "X new" badge logic still applies relative to `lastVisitedAt`.
- In `InteractionNotificationItem`, no changes needed; the contentPreview already shows the reply text.

## Files touched

- `src/pages/TheVillage.tsx` — remove DB bulk update, keep client-side event dispatch
- `src/pages/GroupProfile.tsx` — read `post`/`comment` from URL, pass down
- `src/components/group/GroupPostsTab.tsx` — accept focus props, scroll+highlight target post
- `src/components/group/GroupPostComments.tsx` — accept focus prop, force-expand and scroll+highlight target comment

No DB migrations, no schema changes, no resolver changes.

## Result

Clicking a Village reply notification:
- Lands on the correct group, Posts tab.
- Scrolls to the parent post, highlights it briefly.
- Auto-expands the comment thread and highlights the new reply.
- The "X new" badge on the comments count still appears, since `last_visited_at` is no longer prematurely cleared by visiting `/the-village`.
