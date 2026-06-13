# Generic link previews in The River

Today `LinkPreview` only renders when a URL matches a PixelFed or PeerTube path pattern. Every other link (blogs, news, indie sites, Fediverse posts that don't match the two known shapes, etc.) silently returns `unknown` and shows nothing. We'll extend the pipeline to render a generic OpenGraph card for any link that isn't on the Big Tech blocklist.

We keep two existing rules per project memory:
- Big Tech domains (YouTube, FB, Instagram, X/Twitter, TikTok, Reddit, LinkedIn, Threads, Snapchat, Pinterest) stay blocked — no preview, no outbound fetch.
- SSRF protections (localhost / private IPs / metadata endpoints) stay in place.

## What changes

### 1. Edge function: `supabase/functions/link-preview/index.ts`
- Add a new result type `'generic'` alongside `pixelfed | peertube | unknown`, with fields: `title`, `description`, `image_url`, `site_name`, `favicon_url`, `original_url`.
- Refactor `fetchOgPreview` so it can be called for any URL (not only as a PixelFed/PeerTube fallback). Promote it to the main path:
  1. SSRF check → unknown
  2. Big Tech check → unknown
  3. PeerTube path → existing API probe (unchanged)
  4. PixelFed path → existing oEmbed probe (unchanged)
  5. **Otherwise** → call OG scraper with `type: 'generic'` (today this branch returns `unknown`)
- The OG scraper already reads only the first 50 KB and respects a 3 s timeout — reuse as-is.
- Pull `og:site_name` and a favicon (`<link rel="icon">` first match, fallback to `/favicon.ico`) in addition to current OG fields.
- If neither title, description, nor image is found, still return `unknown` so the UI hides the card.

### 2. Client: `src/components/LinkPreview.tsx`
- Loosen `isPreviewableUrl` so any non-Big-Tech, non-blocked `http(s)` URL is sent to the edge function. Keep the Big Tech short-circuit so we don't waste a function invocation.
- Extend `LinkPreviewData` with the `generic` type plus `site_name` and `favicon_url`.
- Add a third render branch for `type === 'generic'`: a compact card (favicon + site name on top, title bold, 2-line description, optional thumbnail on the right) that links to the URL. Use existing semantic tokens (`bg-muted/50`, `border-border`, `text-muted-foreground`), no custom colors.
- Loading state stays silent (return `null`) so the card just appears when data is ready — matches today's behavior.

### 3. Scope guardrails
- Only `LinkPreview.tsx` and the edge function change. `RiverEntryCard` already mounts `<LinkPreview url={entry.link} />`, so River, SharedPost, and anywhere else that renders `RiverEntryCard` pick this up automatically.
- Brook / Group post cards are out of scope unless you want them included — say the word and I'll extend.
- No DB changes, no new tables, no schema migration.

## Technical notes

- Edge function response shape stays backward-compatible; the client just learns one new `type`.
- Favicon resolution: prefer `<link rel="icon" href="...">` (resolve relative URLs against the page origin), else `${origin}/favicon.ico`. Don't fetch the favicon server-side — let the browser load it.
- We keep the existing auth requirement on the edge function (Bearer token check) so unauthenticated scraping isn't possible.
- Per-URL cost: one extra `fetch` of up to 50 KB per non-PixelFed/PeerTube link the first time it appears in a viewer's River. No caching layer added now — if River feeds get heavy we can add an in-memory or table-backed cache in a follow-up.

## Out of scope

- Big Tech oEmbed integrations (YouTube/Twitter embed cards) — explicit project rule.
- Caching layer for OG results.
- Previews in Brook, Group posts, Messages, Scrolls — easy follow-ups if you want them.
