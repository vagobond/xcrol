
# Scrolls v2 — Plan

v1 shipped the core loop: bundle your own Xcrol/group posts into an ordered Scroll, reorder, add interludes, export Markdown or print-to-PDF. v2 turns Scrolls into real publishable artefacts and opens The Castle as a library.

## Goals

1. Produce **real** publishable files (ePub, proper PDF) — not just `window.print()`.
2. Give writers light, opt-in **AI help** (titles, blurbs, chapter splits, copyedit pass).
3. Stand up **The Castle** as a public library where finished Scrolls live — free tier first, paid tier wired but dark.
4. Lay the **monetisation rails** (60/40 split) without turning them on until volume justifies it.

## Phase 1 — Real exports + cover art

### ePub + PDF export (edge function)
- New edge function `export-scroll` (`verify_jwt = true`, owner check via service role).
- Input: `scroll_id`, `format: 'epub' | 'pdf'`.
- Pulls scroll + items via `get_scroll_contents` (already exists).
- ePub: assemble OPF/NCX/spine in-memory with a small Deno-compatible builder (no native deps); zip via `jsr:@deno-library/zipjs` or hand-rolled — return as `application/epub+zip`.
- PDF: server-render HTML → PDF using `npm:@react-pdf/renderer` or a Pandoc-style template; ship a single page-break-aware stylesheet shared with the on-site reader.
- Cover image embedded if present; otherwise generated title page.
- Frontend: replace the `Export` dropdown's "Print / Save as PDF" with real PDF + new ePub item; keep Markdown.

### Cover art
- Add `cover_image_url` upload to `ScrollEditor` (already in schema). New public storage bucket `scroll-covers` with owner-write / public-read policies.
- Optional one-click cover generation via Lovable AI image model (Gemini flash-image), stored in same bucket.

### Reader polish
- `ScrollReader` gets a typeset "book" view (serif, drop caps on chapter starts, generous measure) used both on-site and as the PDF template source.

## Phase 2 — Light AI assistance (Lovable AI Gateway, no user key)

One edge function `scroll-ai` with `action` discriminator. Always operates on the owner's scroll only.

- `suggest_title` — given blurb + first N items, return 5 title candidates.
- `suggest_blurb` — 2-paragraph back-cover blurb from the contents.
- `suggest_chapters` — propose `chapter_label` groupings across existing items based on date clusters + theme; returns a diff the user accepts/rejects per item (never auto-applies).
- `polish_interlude` — copyedit a single interlude (user-triggered, never rewrites original Xcrol/River posts — those stay verbatim, this is a hard rule).
- Model default: `google/gemini-2.5-flash`. Rate-limit per user per day in a `scroll_ai_usage` table.

UI: small "✨ Suggest" buttons next to title/blurb/chapter fields; a "Polish" button only on interlude cards. No bulk auto-rewrite anywhere.

## Phase 3 — The Castle (public library, free tier)

Repurpose `/castle` from the current "gates of progress" page (keep that as an entry vestibule) into a real library once the user is inside.

### Schema additions
- `castle_publications` — `id`, `scroll_id` (unique), `user_id`, `slug` (unique), `published_at`, `status` ('draft','listed','unlisted','removed'), `price_cents` (nullable, null = free), `cover_image_url`, `summary`, `tags text[]`, `language`, `nsfw bool`, `word_count`, `download_count`.
- `castle_downloads` — log per download (anonymised IP hash + user_id when present) for analytics + future royalty calc.
- `castle_reviews` — `publication_id`, `user_id`, `rating 1-5`, `body`, unique per pair.
- RLS: publications readable by everyone when `status='listed'`; writable only by owner. Reviews readable to all, insert by authed non-owners.

### Publish flow
- "Publish to Castle" button in `ScrollEditor` once the Scroll has a cover + title + blurb + ≥1 item.
- Content policy gate (re-uses existing content policy modal pattern).
- Generates immutable ePub + PDF snapshots stored under `castle-publications/{pub_id}/`; the live Scroll can keep evolving but the published artefact is frozen until "Republish" creates a new version row (`castle_publication_versions`).

### Library UI
- `/castle` (gated landing stays) → once unlocked, shows tabs: **Browse**, **My shelf**, **My publications**.
- Browse: card grid with cover/title/author/blurb/tag chips, sort by newest / most-read / top-rated.
- Detail page `/castle/:slug`: cover, metadata, reader (same component), Download (ePub/PDF), reviews. Anonymous read allowed; download requires auth.
- SEO: per-publication OG via existing `og-post` edge function pattern (new `og-castle` function).

## Phase 4 — Paid tier (built, dark-launched)

Schema and UI ready; flag `castle_payments_enabled` in a `feature_flags` table starts `false`.

- **Provider**: Stripe via Lovable's seamless payments (Lovable AI Gateway equivalent — `enable_stripe_payments`). MOR/tax option 1 picked at our level, since publications are digital, mostly cross-border, and authors aren't running tax registrations.
- **Split**: 60 author / 40 platform, enforced at payout time, not per-checkout (avoids Stripe Connect complexity initially).
- **Author payouts**: deferred — track `castle_author_balances` ledger now (credit on each paid download minus fees), surface "Pending earnings" in author dashboard, payout button stays disabled until we wire Stripe Connect Express in a later phase. Document clearly on the publish screen.
- **Checkout**: one-off purchase per publication (no subscriptions in v2). After success, webhook writes a `castle_purchases` row granting download rights.
- **Pricing**: author picks from a curated set (Free, $2.99, $4.99, $7.99, $12.99) to avoid race-to-bottom and keep tax codes consistent.

## Phase 5 — Discovery + social hooks

- River post type "Scroll published" auto-cards new publications among the author's friends (respect existing privacy levels).
- Profile card section "Published Scrolls" linking to Castle entries.
- NOSTR bridge: optional `kind 30023` (long-form) publish of public/free Scrolls only — gated by the existing NOSTR identity toggle.
- ActivityPub outbox: emit a `Note` with the Castle URL on publish (uses planned outbox infra).

## Infrastructure needs

```text
storage/
  scroll-covers/        public read, owner write
  castle-publications/  public read, system write only (edge fn via service role)

edge functions/
  export-scroll         ePub + PDF generation
  scroll-ai             title/blurb/chapter/polish via Lovable AI Gateway
  castle-publish        freeze snapshot, create version, write artefacts
  castle-checkout       (Phase 4) create Stripe session
  castle-webhook        (Phase 4) handle stripe events
  og-castle             OG image/meta per publication

tables/
  scrolls               (exists)
  scroll_items          (exists)
  scroll_ai_usage       per-user/day rate limits
  castle_publications
  castle_publication_versions
  castle_downloads
  castle_reviews
  castle_purchases      (Phase 4)
  castle_author_balances (Phase 4 ledger)
  feature_flags         (or add to existing settings table)
```

Secrets needed later: `STRIPE_*` via the seamless payments tool (Phase 4 only — do not request now).

## Out of scope for v2

- Stripe Connect Express author onboarding & real payouts (Phase 6).
- Subscriptions / serialised Scrolls / chapter-drip releases.
- Co-authored Scrolls (still owner-only first-party content — preserves the existing rule).
- Reader annotations / highlights.
- Print-on-demand.

## Open questions for you

1. **AI scope** — happy with the strict rule that AI never touches original Xcrol/River/group post content, only metadata + interludes?
2. **Castle access** — should the existing `/castle` progress gate also gate *reading* the library, or just *publishing*? My instinct: anyone can browse/read; only "approved" users can publish, to keep quality up.
3. **Pricing tiers** — fixed ladder (Free / $2.99 / $4.99 / $7.99 / $12.99) or free-form within bounds?
4. **Snapshot vs live** — confirm: published artefact is frozen, requires explicit "Republish" to update. (Alternative: always serve live, but then ePub buyers get shifting content — bad.)
