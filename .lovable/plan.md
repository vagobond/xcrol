

## Support All PeerTube and PixelFed Instances + Block Big Tech

### Problem

MakerTube (and hundreds of other PeerTube/PixelFed instances) don't display previews because the edge function uses a hardcoded domain allowlist. The client-side code already detects PeerTube path patterns (`/w/`, `/videos/watch/`) and sends the request, but the edge function rejects any domain not on its list.

### Isolation Verification

I checked every consumer and dependency:

- **`LinkPreview` component** -- used in 4 places: `RiverEntryCard`, `MyXcrol`, `BrookPostCard`, `GroupPostsTab`. All usage is identical: pass a URL, render preview or `null`. No changes to any of these consumers.
- **`link-preview` edge function** -- called only from `LinkPreview.tsx` via `supabase.functions.invoke`. No other code references it.
- **`isPreviewableUrl`** -- private function inside `LinkPreview.tsx`. Not exported.
- **`isPeerTubeUrl` / `isPixelFedUrl`** -- private functions inside the edge function. Not imported elsewhere.
- **No database tables, RLS policies, triggers, or other edge functions are involved.**
- **No changes to any page component, routing, auth, privacy logic, or profile visibility.**

### What Changes (2 files only)

---

#### 1. `supabase/functions/link-preview/index.ts`

Replace `isPeerTubeUrl()` / `isPixelFedUrl()` domain allowlists with path-based detection + API probing:

- **PeerTube detection**: If path matches `/w/{id}` or `/videos/watch/{id}`, probe `{origin}/api/v1/videos/{id}` with a 3-second timeout. If it returns valid PeerTube JSON (has `name`, `uuid` fields), treat as PeerTube. This covers MakerTube, TILVids, and every other instance automatically.
- **PixelFed detection**: If path matches `/p/{user}/{id}`, probe `{origin}/api/v1/oembed?url=...` with a 3-second timeout. If it returns valid oEmbed JSON, treat as PixelFed.
- **Big Tech blocklist**: Add an explicit domain blocklist that rejects YouTube, Facebook, Instagram, X/Twitter, TikTok, Reddit, LinkedIn, and Threads. These return `type: 'unknown'` immediately -- no outbound requests made.
- **Keep all existing SSRF protections** (`isBlockedUrl`) completely unchanged.
- **Keep JWT authentication** completely unchanged.
- **Add 50KB HTML read limit** on the OG fallback scraper to prevent abuse.

```text
Detection flow:
1. SSRF check (isBlockedUrl) -- reject internal URLs
2. Big Tech blocklist -- reject corporate platforms immediately
3. PeerTube path pattern? -> probe API (3s timeout)
4. PixelFed path pattern? -> probe oEmbed (3s timeout)
5. Neither? -> return 'unknown' (no outbound request)
```

#### 2. `src/components/LinkPreview.tsx`

Update `isPreviewableUrl()` to match the edge function's new logic:

- Keep PeerTube path pattern matching (`/w/`, `/videos/watch/`) -- this already exists on line 46
- Add PixelFed path pattern matching (`/p/`)
- Add the same Big Tech blocklist so those URLs never even reach the edge function
- Remove the hardcoded domain lists (no longer needed since detection is path-based)

### What Does NOT Change

| Area | Status |
|------|--------|
| `RiverEntryCard.tsx` | Untouched |
| `BrookPostCard.tsx` | Untouched (already has LinkPreview from previous edit) |
| `GroupPostsTab.tsx` | Untouched (already has LinkPreview) |
| `MyXcrol.tsx` | Untouched |
| All page components | Untouched |
| Database schema / tables | No changes |
| RLS policies | No changes |
| Auth / privacy / profiles | No changes |
| Other edge functions | No changes |
| `isBlockedUrl` SSRF protection | Unchanged |
| JWT validation | Unchanged |

### Big Tech Domains Blocked

```text
youtube.com, youtu.be, facebook.com, fb.com, instagram.com,
twitter.com, x.com, tiktok.com, reddit.com, linkedin.com,
threads.net, snapchat.com, pinterest.com
```

These will be checked by exact domain match (including subdomains like `www.youtube.com`). URLs from these domains will return `null` from LinkPreview -- the plain text link still displays as before.

### Resource Cost

Minimal. The client-side filter ensures only URLs with fediverse path patterns (`/w/`, `/videos/watch/`, `/p/`) ever call the edge function. Regular links (no matching path) never trigger a request. The 3-second timeout on API probes prevents slow instances from consuming resources.

### Risk Assessment

**Zero risk to existing functionality.** The only behavioral change: URLs from unknown PeerTube/PixelFed instances that have the right path patterns will now get previews instead of being silently ignored. All non-matching URLs continue to behave exactly as before.

