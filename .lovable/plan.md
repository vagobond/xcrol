## Notification Flow — Weaknesses & Fix Options

### What's broken today

When a user clicks a notification, they land on a page but often can't tell **what** the notification was actually about. Here's where each notification type lands and why it's unsatisfying:

| Notification | Currently routes to | Problem |
|---|---|---|
| River reply / reply-to-reply | `/the-river?post={entryId}` | Scrolls to and ring-highlights the entry, but **doesn't open or scroll to the actual reply** the user was notified about. |
| Brook post | `/brook/{brookId}` | Drops user at top of brook with no scroll/highlight to the new post. |
| Brook comment | `/brook/{brookId}` | Same — no scroll to the post, comments collapsed, the actual comment is invisible. |
| Brook reaction | `/brook/{brookId}` | Same — user can't see who reacted to which post. |
| Group post | `/group/{slug}` | Lands on Posts tab with no scroll/highlight to the new post. |
| Group comment / reaction | `/group/{slug}` | Same — comment/reaction not visible. |
| Hosting request | `/hearthsurf` | Generic landing page — user must hunt for the specific incoming request. |
| Meetup request | `/hearthsurf` | Same problem. |
| Introduction request | `/the-forest` | Lands on default tab; no scroll/highlight to the specific intro request. |
| Nearby hometown | `/irl-layer` | World map opens unfocused — the new neighbour isn't shown. |
| Unread messages | `/messages` | Doesn't open the specific thread. |
| Reference | `/profile` | Doesn't scroll to or highlight the new reference. |

Also: the **content preview** shown in the notification dropdown is the **parent post content** (e.g., "X commented on your post: 'your own post text…'") — so the user sees their own words quoted back at them, not what the other person actually said.

And: in "Unread only" view (the default), notifications disappear the moment they're clicked, so if the user's deep link fails them, they can't go back and re-read what it was even about.

### Root causes

1. **Resolver routes are too coarse** — most types resolve to a parent page URL, not to the entity itself, and target pages don't accept entity query params.
2. **Content preview = parent content, not the new content** — the resolver fetches and stores the post the comment is *on*, never the comment itself.
3. **Target pages lack deep-link handlers** — only `TheRiver` reads `?post=`. Brook, Group, HearthSurf, Forest, IRL Layer, Messages, Profile have no equivalent.
4. **No in-place expansion** — even with deep links, brook/group comments are collapsed by default; users have to click again to see what was said.

---

### Three options

#### Option A — Minimum viable: better previews + show-on-arrival

Lowest risk, highest immediate clarity gain.

- Change the resolver so `contentPreview` is the **new content** (the reply, comment, or post that triggered the notification) — not the parent post. Show parent context as secondary line where useful (e.g. "replied: '<reply>' on your post '<parent>'").
- For request-type notifications (hosting/meetup/introduction), include the requester's message snippet as `contentPreview`.
- Keep current routing, but in "Unread only" view, **don't immediately remove** clicked notifications — fade them to read state for ~10 seconds before hiding. Lets users re-click if the deep link disappoints.

No new query params, no page changes. Just makes the dropdown self-explanatory so the user already knows what happened before they click.

#### Option B — Recommended: deep-link every notification type

Option A **plus** real deep links and scroll/highlight on every target page.

Changes per surface:
- **Brook page** — accept `?post={postId}&comment={commentId}` query params, scroll to the post, auto-expand its comments, and ring-highlight the post or comment.
- **Group profile** — accept `?post={postId}&comment={commentId}`, force the Posts tab, scroll, expand, highlight.
- **HearthSurf** — accept `?request={requestId}&type=hosting|meetup`, scroll to and ring-highlight that incoming request card.
- **The Forest** — accept `?intro={requestId}`, switch to the Introductions tab and highlight.
- **IRL Layer (world map)** — accept `?focus={profileId}` (or rounded coords), centre the map and open that hometown's profile preview.
- **Messages** — already supports thread routes; switch the notification's link from `/messages` to `/messages/{threadId}` or the equivalent thread URL.
- **Profile** — accept `?reference={referenceId}`, scroll to and highlight the references section / specific reference.

Resolver changes:
- Update `resolveNotifications` to produce these richer routes for each type.
- Continue to enrich `contentPreview` (Option A behaviour).

This is the version that actually solves "I clicked but don't know what it was."

#### Option C — Ambitious: in-place notification preview

Option B **plus** an inline expand in the dropdown itself. Clicking the notification chevron expands the row to show the full reply/comment/request inline (with reply/accept/dismiss actions) without leaving the page. The bell/village/world dropdown becomes a real activity feed. Clicking the notification body still navigates as in Option B.

Bigger UX lift; uses existing data fetched by the enriched resolver, so cost is mostly in the dropdown component. Best long-term direction but more surface to touch.

---

### Suggested path

Ship **Option B**. It's the proportionate fix: every notification gets a route that lands the user on exactly the thing they were notified about, and the dropdown preview already tells them what happened before they click. Option C can follow later as a polish pass once the deep links exist.

### Files that would change for Option B

- `src/lib/notification-resolver.ts` — richer routes + new-content previews.
- `src/pages/Brook.tsx`, `src/pages/GroupProfile.tsx`, `src/pages/HearthSurfing.tsx`, `src/pages/TheForest.tsx`, `src/pages/IRLLayer.tsx`, `src/pages/Profile.tsx`, `src/pages/Messages.tsx` — read query params, scroll, highlight, auto-expand.
- `src/components/BrookComments.tsx`, `src/components/group/GroupPostComments.tsx` — support `defaultExpanded` / target-comment prop.
- `src/components/notifications/InteractionNotificationItem.tsx` — show new-content preview prominently.
- `src/hooks/use-notifications.ts` — soft-hide-on-click delay in "Unread only" mode.

No DB migrations needed; everything builds on existing entities and the existing `read_at` flag.

Which option do you want?