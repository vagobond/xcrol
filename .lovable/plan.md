# Scrolls v2 — Phase 1 Build Plan (revised)

Ship real publishable artefacts (ePub + proper PDF) and a typeset book reader. **No image hosting on Xcrol** — cover art is a user-supplied external URL.

## 1. Cover art — external URL only

No storage bucket. No file upload. No AI generation on our side.

### UI (`ScrollEditor`)
- New "Cover image" field in the meta card:
  - Single `Input` for an external image URL (writes to existing `scrolls.cover_image_url` column).
  - Live thumbnail preview rendered from the URL (with onError fallback to "Couldn't load image").
  - Helper text: *"Paste a link to an image you've hosted elsewhere (e.g. your own site, Imgur, NOSTR image host, IPFS gateway). Xcrol doesn't host images."*
  - Optional small list of suggested generators (text links only): "Try Nano Banana, DALL·E, Midjourney, Leonardo — then host the image yourself and paste the URL here."
- Cover thumbnail shown on `Scrolls` list cards and at the top of `ScrollReader`.

### Safety
- Client-side: validate it parses as a URL and uses `https:`.
- Render cover via `<img referrerPolicy="no-referrer" loading="lazy">`.
- No fetching, no proxying, no storage. The browser/reader/exporter just uses the URL the user pasted.

## 2. Real export — ePub + PDF

New edge function `export-scroll`.

- Input: `{ scroll_id, format: 'epub' | 'pdf' }`.
- Auth: JWT verify, owner check via service role on `scrolls.user_id`.
- Pulls content via existing `get_scroll_contents` RPC + scroll meta.
- Returns the binary with proper `Content-Type` + `Content-Disposition` (filename = slugified title).
- Frontend `ScrollEditor` "Export" dropdown:
  - Replaces "Print / Save as PDF" with "Download PDF" (function call → blob download).
  - Adds "Download ePub".
  - Keeps "Markdown" as-is.

### Cover handling inside exports
- If `cover_image_url` is set, the edge function fetches it once at export time (server-side `fetch`, 5s timeout, max ~5 MB, must respond with an `image/*` content type).
- On success: embed bytes into the ePub (`OEBPS/cover.jpg`) and into the PDF cover page.
- On any failure: skip silently and render a typographic title page instead. The URL itself is never re-stored anywhere.

### ePub (`application/epub+zip`)
- Hand-assembled OPF 3.0 in Deno:
  - `mimetype` (stored, uncompressed first entry per spec).
  - `META-INF/container.xml`.
  - `OEBPS/content.opf` (metadata, manifest, spine).
  - `OEBPS/nav.xhtml` + `toc.ncx` (chapters grouped by `chapter_label`; items without a label fall under an implicit "Prologue").
  - `OEBPS/style.css` shared with the on-site reader (see §3).
  - One XHTML file per chapter.
  - Optional embedded cover if §2 fetch succeeded.
- Zip via `jsr:@zip-js/zip-js` (Deno-compatible). `mimetype` entry stored uncompressed.

### PDF (`application/pdf`)
- `npm:@react-pdf/renderer` server-side in Deno (no headless browser).
- Cover page (embedded image if available, else typeset title page), title page, chapter headings with small caps, body paragraphs with drop caps on chapter starts, page numbers.
- Fonts: bundle two open-licensed fonts in `supabase/functions/export-scroll/fonts/` (one serif body, one display) so output is consistent across OSes.

### Shared content rules
- Original Xcrol / River / group / interlude text rendered verbatim (hard rule, no AI rewriting).
- Each item shows date (using existing `item_date` string from RPC) and group name when present.
- `item.link` rendered as footnote-style URL in PDF, inline `<a>` in ePub.

## 3. Reader polish (`ScrollReader`)

- New "book" stylesheet: serif body (Lora or Cormorant), display headings, ~65ch measure, drop cap on first letter of each chapter, small caps on chapter labels.
- Same CSS file is the source of truth for the ePub `style.css`.
- Cover image (if URL present) shown above the title, with onError fallback.
- Existing print stylesheet kept as a no-cost fallback but not the primary PDF path.

## 4. Database

**No migration needed.** `scrolls.cover_image_url` already exists. No bucket, no AI usage table (no AI in Phase 1 anymore).

## 5. Out of scope for Phase 1 (deferred)

- Castle library, publication snapshots, reviews, downloads tracking.
- AI title/blurb/chapter/polish/cover generation.
- Stripe / payments / payouts.
- NOSTR `kind 30023` bridge and ActivityPub publish event.
- "Republish" / immutable versioning.

## File layout

```text
supabase/functions/
  export-scroll/
    index.ts              # router: format → epub | pdf, auth + owner check
    epub.ts               # OPF/NCX/XHTML assembly + zip
    pdf.tsx               # @react-pdf/renderer document
    shared.ts             # fetch scroll meta + contents, fetch+validate cover
    fonts/                # bundled .ttf files for the PDF

src/pages/
  ScrollEditor.tsx        # + cover URL input & preview, + new Export menu items
  ScrollReader.tsx        # + book view stylesheet, + cover render
  Scrolls.tsx             # + cover thumbnail on cards

src/lib/
  scroll-export.ts        # client wrapper: invoke export-scroll, save blob
```

## Order of execution once approved

1. `export-scroll` edge function (ePub first, then PDF) + bundled fonts + client wiring.
2. Cover URL input + previews in editor, reader, and list cards.
3. Reader book view typography pass.
4. QA: create a real Scroll, paste a cover URL, export both formats, open ePub in a reader, open PDF, verify on-site reader matches.

## Open question

OK to bundle two open-licensed font `.ttf` files (~400 KB total) inside the `export-scroll` function so PDFs render identically for everyone? Alternative is to use built-in PDF fonts (Helvetica/Times) which look generic.
