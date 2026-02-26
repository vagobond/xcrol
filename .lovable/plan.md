

## Improve Notification UX: Deep Linking, Grouping, and Context

### The Problems

1. **Notifications don't take you to the right place.** Clicking "Alice commented on your group post" takes you to `/the-village` (the groups listing page), not to the actual group or post. Same issue for River replies, Brook activity, etc.
2. **Multiple notifications from the same context are listed individually.** If 3 people react to your Brook post, you see 3 separate notification items instead of "Alice, Bob, and Carol reacted to your Brook post."
3. **No content preview.** You can't tell which post or comment is being referenced without clicking through.

### The Solution

#### 1. Deep-link notifications to the actual content

Each notification already stores an `entity_id` that references the specific reply, comment, reaction, or request. The plan is to resolve that entity to a navigable URL:

| Notification Type | Current Route | Improved Route |
|---|---|---|
| `river_reply` | `/the-river` | `/the-river?post={xcrol_entry_id}` (scrolls + highlights) |
| `river_reply_reply` | `/the-river` | `/the-river?post={xcrol_entry_id}` |
| `brook_post` | `/the-forest` | `/brook/{brook_id}` (directly to the Brook page) |
| `brook_comment` | `/the-forest` | `/brook/{brook_id}` |
| `brook_reaction` | `/the-forest` | `/brook/{brook_id}` |
| `group_comment` | `/the-village` | `/group/{slug}` (directly to the group) |
| `group_reaction` | `/the-village` | `/group/{slug}` |
| `group_comment_reaction` | `/the-village` | `/group/{slug}` |
| `hosting_request` | `/hearthsurfing` | `/hearthsurf` (already correct route name) |
| `meetup_request` | `/hearthsurfing` | `/hearthsurf` (fix broken route) |

This requires a lookup query when the notification is clicked, to resolve entity_id into the correct parent IDs (e.g., reply -> entry_id, comment -> post -> group slug).

#### 2. Group notifications by context

Instead of showing 5 individual "reacted to your post" items, group them:

- **Same entity, same type**: "Alice, Bob, and 3 others reacted to your Brook post"
- **Same actor, different types in the same area**: Keep separate (different actions warrant separate items)

Grouping happens client-side in the notification hook by bucketing notifications that share the same `type` and `entity_id` (for reactions) or same parent entity (for comments on the same post).

#### 3. Add content preview snippets

Show a truncated preview of the content being referenced:

- For River replies: first 60 chars of the original Xcrol entry
- For Brook posts/comments: first 60 chars of the post content
- For group comments: first 60 chars of the group post

This requires fetching a small amount of extra data when loading notifications.

### Technical Changes

#### File 1: `src/hooks/use-notifications.ts`
- Modify `loadInteractionNotifications()` to also fetch entity context (parent IDs, content snippets) via joined queries or a small RPC
- Group notifications by `(type_category, parent_entity_id)` before setting state
- Store resolved route paths on each notification object

#### File 2: `src/components/notifications/InteractionNotificationItem.tsx`
- Accept grouped notification data (multiple actors, content preview)
- Display grouped actor names ("Alice, Bob, and 2 others")
- Show content preview snippet below the action label
- Use the resolved deep-link route instead of the static `typeConfig.route`
- Navigate with the resolved URL on click

#### File 3: New helper `src/lib/notification-resolver.ts`
- Contains async functions to resolve `entity_id` to a navigable URL:
  - `river_reply` / `river_reply_reply`: query `river_replies` to get `entry_id`, navigate to `/the-river?post={entry_id}`
  - `brook_post` / `brook_comment` / `brook_reaction`: query to get `brook_id`, navigate to `/brook/{brook_id}`
  - `group_comment` / `group_reaction` / `group_comment_reaction`: query to get group `slug`, navigate to `/group/{slug}`
  - `hosting_request` / `meetup_request`: navigate to `/hearthsurf`
- Also fetches content snippets (first 60 chars of the related post/entry)

#### File 4: `src/hooks/use-notifications.ts` (grouping logic)
- After fetching and resolving notifications, group by `(type_bucket, resolved_parent_id)`:
  - `river_reply` + `river_reply_reply` on same entry -> group
  - `brook_reaction` on same post -> group
  - `group_reaction` on same post -> group
- Each grouped notification has: `actors: {name, avatar}[]`, `count`, `content_preview`, `resolved_route`

### What Does NOT Change

- Database schema (no migrations needed)
- RLS policies
- Notification trigger functions (they already store the right `entity_id`)
- Friend request notifications (already work well with their own dialogs)
- Reference notifications (already work well)
- Unread message notifications (already link to `/messages`)
- Any page component routing or content rendering
- The `notifications` table structure
- Authentication or privacy logic

### Grouping Example

Before:
```
[icon] Alice reacted to your Brook post
[icon] Bob reacted to your Brook post  
[icon] Carol reacted to your Brook post
[icon] Alice commented on your group post
```

After:
```
[icon] Alice, Bob, and Carol reacted to your Brook post
       "Just finished building the new garden shed..."
[icon] Alice commented on your group post
       "Here's the recipe I was talking about..."
```

### Route Fix

The `hosting_request` and `meetup_request` notifications currently point to `/hearthsurfing` but the actual route is `/hearthsurf`. This will be corrected.

