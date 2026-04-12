

## What's Already Fixed vs. What Remains

### Already Fixed (from our recent work)
1. **Mapbox token JWT** — edge function now validates Bearer token via `getClaims()`
2. **Admin route protection** — `/admin` was already wrapped in `<ProtectedRoute>` (Claude was wrong)
3. **Markdown `javascript:` stripping** — regex removes dangerous hrefs
4. **Messages returnUrl** — now passes `?returnUrl=%2Fmessages`
5. **MyXcrol `.limit(50)`** — added
6. **Invite code label** — changed to "required for access"
7. **ErrorBoundary** — wraps all lazy routes
8. **Castle tooltip** — SVG title added

### Claude Was Wrong About These
- **Brook RLS** — RLS policies DO exist on `brook_posts`, `brook_reactions`, `brook_comments`. SELECT is restricted to brook participants via JOIN to `brooks` table. This is NOT client-side only.
- **OAuth PKCE** — `code_challenge` IS stored in `oauth_authorization_codes` and IS validated in `oauth-token/index.ts` with proper S256 hashing. The audit was incorrect.

### What Genuinely Remains (5 items)

**Security:**
1. **Hometown coordinates exposed via `get_public_hometowns()`** — This SECURITY DEFINER function returns exact lat/lng to ALL authenticated users, contradicting `get_visible_profile()` which restricts coords to close friends. Fix: return only city/country in `get_public_hometowns()`, or round coordinates to ~10km precision.

**Architecture:**
2. **Dismissed notifications in localStorage** — Reference notification dismissals stored in `localStorage` are lost when switching browsers/devices. Fix: move to a `dismissed_notifications` DB table or add a `dismissed_at` column to the notifications table.
3. **TheTown local state navigation** — browser back button breaks inside the marketplace because it uses React state for page transitions instead of URL params. Fix: use URL search params for navigation state.

**User Flow:**
4. **Invite code in sessionStorage lost on cross-browser confirm** — If a user signs up on device A and confirms email on device B, `sessionStorage` doesn't carry over. The invite code is never consumed and the account is permanently locked. Fix: store the pending invite code in a DB table (e.g. `pending_invite_codes`) keyed by user ID, consumed on first login after confirmation regardless of device.
5. **IRL Layer empty state** — First-time user sees a blank map with no guidance. Fix: add an overlay prompt ("Tap anywhere to claim your hometown") when no hometown is set.

### Recommended Priority
1. Invite code cross-browser fix (users getting permanently locked out)
2. Hometown coordinate precision (privacy issue)
3. IRL Layer empty state (usability)
4. TheTown back button (UX polish)
5. Dismissed notifications to DB (minor UX)

Want me to implement these remaining fixes?
