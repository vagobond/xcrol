
# Scrolls v2 — Phase 3: Publication & The Castle Library

Phase 1 shipped private export (ePub/PDF) and Phase 2 shipped optional AI assistance. Phase 3 turns Scrolls from **personal artefact** into **shareable work**: authors can *publish* an immutable snapshot to a public **Castle Library**, and readers can discover, read, and react.

No payments, no NOSTR/ActivityPub bridge, no reviews-with-stars yet — those stay deferred. Focus is the publication primitive everything else builds on.

## 1. Publication primitive

A "publication" is an **immutable snapshot** of a Scroll at a moment in time. The author keeps editing the live Scroll freely; the published copy doesn't change.

### New tables

- `scroll_publications`
  - `id`, `scroll_id` (FK), `user_id` (author, FK auth.users)
  - `slug` (unique, derived from title + short hash)
  - `title`, `subtitle`, `blurb`, `cover_image_url` (snapshot)
  - `content_json` — full snapshot of items (id, kind, body, link, item_date, chapter_label, group name) so reads never touch live data
  - `visibility` — `public` | `unlisted` (no `private`; that's just "don't publish")
  - `published_at`, `unpublished_at` (nullable, soft hide)
  - `view_count`, `reader_count` (denormalised, updated by triggers/RPC)
- `scroll_publication_reactions`
  - `id`, `publication_id`, `user_id`, `emoji` (one of a small allow-list), `created_at`
  - Unique `(publication_id, user_id, emoji)`

### RLS

- `scroll_publications`:
  - SELECT: anyone (incl. anon) when `visibility = 'public' AND unpublished_at IS NULL`; owner can always see own; `unlisted` is fetchable only by slug (enforced by always querying with slug).
  - INSERT/UPDATE/DELETE: owner only. UPDATE is restricted to `visibility`, `unpublished_at`, denorm counters — no body edits (enforced by trigger that blocks changes to snapshot columns).
- `scroll_publication_reactions`: SELECT public; INSERT/DELETE by authenticated user on own rows.

### RPC

- `publish_scroll(scroll_id, visibility)` — server-side snapshot using existing `get_scroll_contents`; returns publication row.
- `unpublish_publication(publication_id)` — sets `unpublished_at`.
- `increment_publication_view(publication_id)` — rate-limited per session.

## 2. The Castle Library (public discovery)

New route `/castle/library` (and a card on existing `/castle`). Public — no auth needed to browse or read.

- Grid of recent public publications: cover thumbnail, title, author display name + `@username`, blurb, reaction count.
- Filters: **Newest**, **Most read**, **Most reacted**, **By friend** (auth only).
- Search box (title + author, simple `ilike` on snapshot columns).
- Pagination (20/page).

The existing `/castle` page becomes the gated "membership"/progress page **plus** a prominent link into the Library (Library itself is open, the gated bit stays as-is).

## 3. Public reader

New route `/library/:slug` (also accept legacy `/scrolls/p/:slug` redirect-friendly).

- Server-side OG meta via new `og-publication` edge function (mirrors `og-post`): title, blurb, cover, author. Meta-refresh to the SPA route for human visitors.
- Reuses `ScrollReader`'s book-view typography (already built in Phase 1) but pulls from `content_json` snapshot, not live items.
- Header: cover, title, subtitle, author chip → links to `/u/:username`, published date, view count.
- Reactions row (emoji allow-list: ✨📜🔥💛🌊🏰). Auth required to react; unauth see counts only with a "Sign in to react" hint.
- Share buttons: copy link, NOSTR share (uses existing NOSTR identity if connected — publishes `kind 1` note linking back; full `kind 30023` bridge stays deferred).
- "Read more from {author}" strip: other public publications by same author.

## 4. Author flow in `ScrollEditor`

- New **Publish** button in the editor toolbar (next to Export).
- Opens `PublishScrollDialog`:
  - Visibility radio: Public (Castle Library) / Unlisted (link only).
  - Preview of cover/title/blurb as it will appear in the Library.
  - Disclosure: "Publishing creates an immutable snapshot. Edits to this Scroll won't change the published copy. You can publish again to update."
  - Confirm → calls `publish_scroll` RPC, toasts success, shows public URL + copy button.
- New **Publications** subsection at the bottom of the editor listing this Scroll's publications (date, visibility, view count, "Unpublish" and "Copy link" actions).
- On `Scrolls` list cards, badge showing "Published" + count of live publications.

## 5. Author profile integration

- On `PublicProfile.tsx` (route `/u/:username`), new tab/section **Scrolls** listing the user's public publications (cover, title, blurb, published date). Only renders when count ≥ 1.
- No changes for users who never publish.

## 6. Sitemap & SEO

- `og-publication` edge function: full OpenGraph/Twitter card with cover image.
- `public/sitemap.xml` regeneration extended (or dynamic edge function) — out of scope as a code change if current sitemap is hand-maintained; instead add `og-publication`-style meta tags to ensure crawlability and rely on inbound links for now. (Sitemap automation = deferred.)

## 7. Out of scope for Phase 3 (still deferred)

- Payments / paid scrolls / payouts / Stripe.
- Reviews with star ratings (only emoji reactions ship).
- NOSTR `kind 30023` long-form bridge (only optional `kind 1` share link).
- ActivityPub `Article` publish event.
- Comments / threaded discussion on publications.
- Versioning UI showing diff between snapshots.
- AI cover generation.
- Editorial curation / featured / staff picks.

## Technical details

### File layout (new)

```text
supabase/functions/
  og-publication/
    index.ts                # OG meta for /library/:slug

src/pages/
  CastleLibrary.tsx         # /castle/library — public grid
  PublicationReader.tsx     # /library/:slug — public reader

src/components/scrolls/
  PublishScrollDialog.tsx
  PublicationsList.tsx      # used inside ScrollEditor
  PublicationReactions.tsx  # used inside PublicationReader
  LibraryCard.tsx           # grid card

src/lib/
  scroll-publish.ts         # client wrappers for publish/unpublish/list
```

### Files edited

- `src/App.tsx` — three new routes (`/castle/library`, `/library/:slug`, legacy redirect).
- `src/pages/ScrollEditor.tsx` — Publish button, dialog, publications list.
- `src/pages/Scrolls.tsx` — "Published" badge on cards.
- `src/pages/TheCastle.tsx` — Library entry card.
- `src/pages/PublicProfile.tsx` — Scrolls section when author has publications.
- `supabase/config.toml` — register `og-publication` (`verify_jwt = false`).

### Snapshot integrity

- The publish RPC takes a **fresh** call to `get_scroll_contents(scroll_id)`, serialises to JSON, stores in `content_json`. Original posts remain in their source tables; the snapshot is a read-only copy used only by the public reader/export.
- Trigger on `scroll_publications` blocks any UPDATE that touches `title`, `subtitle`, `blurb`, `cover_image_url`, or `content_json` — guaranteeing immutability.

### Reactions

- Allow-list enforced via DB CHECK on `emoji IN ('✨','📜','🔥','💛','🌊','🏰')`.
- One row per `(publication, user, emoji)` so toggling is idempotent.
- Counts computed via cheap aggregate; cache nothing in Phase 3.

### Privacy

- `unlisted` publications are excluded from the Library grid and any sitemap; only retrievable when the caller supplies the slug (RLS policy intentionally allows anon SELECT by slug since the slug is the access token).
- Authors can unpublish at any time → `unpublished_at` set → the row stops being served by the public reader and disappears from author profile + library.

## Order of execution once approved

1. Migration: tables, RLS, immutability trigger, RPCs.
2. `scroll-publish.ts` client wrappers.
3. `PublishScrollDialog` + editor wiring + publications list.
4. `CastleLibrary` page + `LibraryCard`.
5. `PublicationReader` page + reactions.
6. `og-publication` edge function + config.
7. PublicProfile Scrolls section + Scrolls list "Published" badge + Castle library entry.
8. QA: publish a Scroll, view in Library (anon), react (auth), unpublish, verify removal, edit live Scroll and confirm snapshot unchanged, re-publish to create v2.

## Open questions

1. **Slug collisions**: title + 6-char hash (e.g. `wandering-years-a1b2c3`) — OK, or prefer `@username/scroll-title` style?
2. **Reaction emoji set** (`✨📜🔥💛🌊🏰`) — keep these six, or pick a different set that fits XCROL vibe better?
3. **NOSTR share button** in the public reader — ship in Phase 3 as `kind 1` link, or defer entirely until full `kind 30023` bridge?
