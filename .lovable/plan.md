# Public access for profiles, River, and Village

Logged-out visitors can browse public content and start typing replies; submitting requires a verified Xcrol account.

## 1. Public profiles

- Remove `ProtectedRoute` from `/u/:userId` and `/:username` in `src/App.tsx`.
- In `PublicProfile.tsx` + `usePublicProfileData.ts`: keep all data fetches read-only and guard any "friend / message / request" action buttons (`ProfileActionBar`) behind an auth check — show the inline sign-up modal (see §4) when a guest clicks them.
- Hide sections that already require auth context (Brooks, private references, edit affordances) for guests.
- Add per-route `<Helmet>` title/description/canonical/og:* (og-profile edge function already provides the OG image).
- RLS check: confirm `profiles` SELECT policy permits anon for the columns shown; tighten via a public view if any sensitive column leaks.

## 2. The River — public posts

- Remove `ProtectedRoute` from `/the-river`.
- In `TheRiver.tsx`, when `user` is null:
  - Fetch only the **5 most recent** `xcrol_entries` where `privacy_level = 'public'`.
  - Render reply input fields normally; intercept submit → sign-up modal.
  - Show a "Sign up to see more" CTA at the bottom of the 5-item list (and on any "load more" / pagination control).
  - Block opening reply threads beyond first level / reactions → sign-up modal.
- `/post/:postId` already public — verify it shows the same guest reply UX.
- RLS: ensure anon `SELECT` on `xcrol_entries WHERE privacy_level='public'` (and on `river_replies` for the public parent).

## 3. The Village — public hub + public groups

- Remove `ProtectedRoute` from `/the-village` and `/group/:slug`.
- `TheVillage.tsx`: when guest, list only `groups WHERE trust_level = 'public'`; hide create/join/notification controls; show sign-up CTA.
- `GroupProfile.tsx`: if `trust_level != 'public'` and visitor is anon → render a "Sign in to view this group" gate. If public:
  - Show group meta, member count, posts, comments (read-only).
  - Reply / react / join → sign-up modal.
- RLS: anon `SELECT` on `groups WHERE trust_level='public'`, `group_posts`/`group_post_comments`/`group_post_reactions` joined to a public group. Use a SECURITY DEFINER helper `public.is_public_group(group_id)` to keep policies non-recursive.

## 4. Guest reply UX (shared component)

- New `<GuestAuthGate>` wrapper / `useGuestSubmitGuard()` hook used by River replies, group post comments, profile actions.
- Guests can focus and type freely in any reply textarea.
- On submit (or on protected action click) → open an **inline auth prompt modal** containing:
  - "Sign up or sign in to post" message.
  - Sign-up + sign-in tabs (reusing `Auth` page components inline).
  - Note that email verification is required before posting.
- Draft text stays in the field; modal is dismissible. We do **not** auto-submit after verification (per chosen UX).

## 5. SEO / previews

- Per-route Helmet tags on PublicProfile, TheRiver, GroupProfile, and existing SharedPost.
- Reuse existing `og-profile` and `og-post` edge functions; add an `og-group` edge function returning a rendered card for public groups, wired to `/group/:slug` meta-refresh fallback (mirrors `og-host`).

## Technical details

**Files edited**
- `src/App.tsx` — drop `ProtectedRoute` on 4 routes.
- `src/pages/PublicProfile.tsx`, `src/components/public-profile/*` — guest-aware rendering + Helmet.
- `src/pages/TheRiver.tsx` (+ `RiverEntryCard`, reply components) — 5-post guest mode, sign-up CTA.
- `src/pages/TheVillage.tsx`, `src/pages/GroupProfile.tsx` (+ group post components) — guest mode, public-only filtering.
- `src/pages/SharedPost.tsx` — wire guest reply UX.
- New `src/components/auth/GuestAuthGate.tsx` + `src/hooks/useGuestSubmitGuard.ts`.
- New `supabase/functions/og-group/index.ts` + `supabase/config.toml` entry (no verify_jwt change needed).

**Migration (one file)**
- `is_public_group(uuid)` SECURITY DEFINER helper.
- Add/adjust RLS policies to grant anon `SELECT` on: `profiles` (public-safe columns via view if needed), `xcrol_entries` where `privacy_level='public'`, `river_replies` on public parents, `groups` where `trust_level='public'`, `group_posts`/`group_post_comments`/`group_post_reactions` on public groups. `GRANT SELECT ... TO anon` on each affected table/view.

**Out of scope**
- No changes to NOSTR/ActivityPub bridges.
- No new privacy fields — uses existing `privacy_level` and `trust_level`.
- No change to friends-only / family-only content visibility.
