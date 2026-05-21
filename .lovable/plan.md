# Scrolls — bundle your own content into a book

A Scroll is a user-curated collection of *their own* writing pulled from XCROL, exported as an ePub/PDF/Markdown they own. v1 is a free personal archive tool; the Castle marketplace is sketched but not built.

## What goes in a Scroll

Only the author's own first-party content:
- **Xcrol entries** (any privacy level — author owns them)
- **River posts** (author's posts only — no other users' replies, even on their own threads, since those belong to other authors)
- **Group posts** they authored

Out of v1: Brook posts (would need both participants' consent — revisit later), replies from other people, reactions.

## Bundling UX (hybrid)

A new `/scrolls` page under Powers, plus a "Bundle into a Scroll" button on My Xcrol.

1. **Create a draft Scroll** — title, optional subtitle, cover blurb.
2. **Auto-compile step** — user picks date range + which content types to include. We pre-populate the draft with everything matching, in chronological order, grouped by month as "chapters".
3. **Manual curation** — reorder items via drag handle, rename chapters, exclude individual entries (soft — they stay in DB, just unchecked in this Scroll), add free-text "interlude" notes between entries.
4. **Preview** — rendered like a long-form reading view.
5. **Export** — Markdown, ePub, PDF download. Encourage in copy: "Take this to ChatGPT/Claude to polish into a publishable book."
6. **Archive** — Scrolls live in the user's library; can be re-exported anytime, edited, or deleted. Re-running auto-compile on the same Scroll merges new entries without losing manual edits.

## Castle / Library of Alexandria (v2 sketch, not built now)

Frame the existing Castle page as the future home of published Scrolls. v1 adds a single teaser card: "Soon: publish your Scroll to the Castle library. 60% to you, 40% to XCROL." No marketplace, no payments, no Stripe wiring yet. We revisit once users actually have Scrolls to sell.

## Technical sketch

**New tables**
- `scrolls` — `id, user_id, title, subtitle, blurb, cover_image_url, created_at, updated_at`. RLS: owner-only for SELECT/INSERT/UPDATE/DELETE in v1. (Public visibility column reserved for v2.)
- `scroll_items` — `id, scroll_id, position int, item_type ('xcrol'|'river'|'group_post'|'interlude'), source_id uuid nullable, custom_title text nullable, custom_body text nullable, chapter_label text nullable`. RLS via parent scroll ownership. `source_id` references the original row; `custom_body` only used for interludes.

**Resolution at render time**
Single RPC `get_scroll_contents(scroll_id)` joins items to their source tables (`xcrol_entries`, `river_entries`, `group_posts`), filtering to rows where `user_id = scroll.user_id` (defensive — also enforces "only your own content" if a source ever gets reassigned). Returns ordered array with resolved content.

**Auto-compile**
RPC `compile_scroll_draft(scroll_id, start_date, end_date, include_xcrol bool, include_river bool, include_groups bool)` inserts `scroll_items` for the user's matching rows, skipping any source_id already in the scroll. Default chapter_label = `to_char(entry_date, 'Mon YYYY')`.

**Export**
Client-side for Markdown + PDF (use `jspdf` already-or-similar, or simple `window.print` styled view for PDF v1). ePub via a small edge function `export-scroll-epub` using a Deno epub library — returns a downloadable blob. Keep the edge function stateless; it calls `get_scroll_contents` with the user's JWT.

**Frontend**
- `src/pages/Scrolls.tsx` — list + create
- `src/pages/ScrollEditor.tsx` — draft editing, drag-reorder (`@dnd-kit` already in deps if present, else add), auto-compile modal
- `src/pages/ScrollReader.tsx` — preview / printable view
- `src/components/scrolls/*` — item row, chapter divider, export menu

**Entry points**
- Card on `/powers` ("Bundle your Scroll")
- Button on `/xcrol/me` and on user's own River feed header
- Castle page gets a single "Coming soon: publish to the library" teaser card

## Out of scope for this plan

- Payments, Stripe Connect, 60/40 split — deferred to v2 after we see adoption.
- In-app AI rewriting — user said export-only; we just provide clean Markdown.
- Cover image generation — user can attach an image, no AI generation in v1.
- Public/shared Scroll URLs — defer to v2 alongside the marketplace.
- Brook bundling — needs consent flow, defer.
