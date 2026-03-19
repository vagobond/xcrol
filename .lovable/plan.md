

## Performance Audit — 10 Specific Issues Found

Based on profiling data, network waterfall analysis, and code inspection, here are the concrete performance problems identified in XCROL.

### Key Metrics Measured
- **First Contentful Paint: 5,776ms** (should be under 1,800ms)
- **DOM Content Loaded: 5,672ms**
- **105 script requests** loaded during initial page render
- **favicon.png loaded 5 times** (295KB each = 1.4MB wasted)
- **lucide-react.js: 161KB, 1,375ms** — single slowest script

---

### Ordered by EASE OF IMPLEMENTATION (easiest first)

| # | Issue | Evidence | Fix |
|---|-------|----------|-----|
| 1 | **Favicon loaded 5 times** | Network log shows 5 separate GET requests for `/favicon.png` (295KB each). Caused by duplicate `<link>` tags in both `index.html` AND the Helmet component in `App.tsx`. | Remove the 4 favicon `<link>` tags from the `<Helmet>` in App.tsx — index.html already declares them. |
| 2 | **favicon.png is 295KB** | Performance profile shows it as one of the largest resources. A favicon should be under 10KB. | Compress/resize favicon.png to a proper 32x32 or 48x48 PNG (should be ~2-5KB). |
| 3 | **xcrol-logo.png is 326KB** | Largest single resource at 326KB, 740ms to load. It's a logo image that should be an SVG or compressed WebP. | Convert to WebP or SVG. Add `width`/`height` attributes (already present) and use a compressed version. |
| 4 | **AppHeader loads for unauthenticated users** | `AppHeader` always renders and always calls `useVillageActivityCount()`, which runs DB queries even when `user` is null (it early-returns but the hook + its imports still execute). The header shows nothing for logged-out users except ThemeToggle and "Sign In". | Make AppHeader a lightweight wrapper that only imports NotificationBell/UserMenu/village-activity when `user` exists (lazy or conditional). |
| 5 | **useVillageActivityCount polls every 5 minutes** | `use-village-activity.ts` line 71: `setInterval(fetchCount, 300_000)`. Each poll fires 2 sequential DB queries (`group_members` then `group_posts` with up to 500 rows). On slow connections this blocks the main thread. | Increase interval to 10+ minutes, or switch to a realtime subscription on `group_posts`. Also guard against concurrent fetches. |
| 6 | **Notification waterfall: 7+ sequential DB queries on mount** | `use-notifications.ts` fires `loadRequests`, `loadPendingFriendships`, `loadNewReferences`, `loadUnreadMessageSenders`, and `loadInteractionNotifications` in parallel — but each internally does 2-3 sequential queries (e.g., fetch data → fetch profiles). `loadInteractionNotifications` also calls `resolveNotifications` which triggers up to 7 more parallel query chains, each 2-3 levels deep. Total: ~15-20 DB round-trips on every page load for logged-in users. | Consolidate into a single RPC function (`get_user_notifications`) that returns all notification data with profiles pre-joined server-side. |
| 7 | **notification-resolver.ts: deep query chains** | `resolveNotifications` does multi-hop lookups: e.g., `group_comment_reactions` → `group_post_comments` → `group_posts` → `groups`. That's 4 sequential queries per notification type. | Move resolution logic into the database RPC. Return resolved routes and content previews directly from a single function. |
| 8 | **Welcome page blocks on GIF load** | `scroll-paper-open-up.gif` must fully load before `onLoad` fires, which then starts a 3-second timer before showing content. On slow connections the user sees a spinner for the entire GIF download + 3 seconds. The logo (326KB) also loads only after the GIF phase. | Show content immediately with a fade-in. Load the GIF as a progressive enhancement. Set a max-wait timeout (e.g., 2s) so content appears even if the GIF hasn't loaded. |
| 9 | **lucide-react imports the full icon library** | Network shows `lucide-react.js` is 161KB and takes 1,375ms. This is the entire icon set being bundled as a single chunk instead of tree-shaking individual icons. | Configure Vite to use `lucide-react`'s individual icon imports (they already do `import { Home } from "lucide-react"` which should tree-shake, but the Vite dep pre-bundling combines it). Add `lucide-react` to `optimizeDeps.exclude` or use the `lucide-react/icons/*` deep imports. |
| 10 | **TheRiver: 3-step serial query waterfall** | `loadEntries` in TheRiver.tsx calls `get_river_entries` RPC, then fetches reactions + replies in parallel, then does a third sequential query for reactor profiles. On a slow connection with 20 entries, this is 3 network round-trips minimum before any content renders. | Extend the `get_river_entries` RPC to return reactions and reply counts inline, or at minimum merge the reactor profile fetch into the parallel batch. |

---

### Ordered by IMPACT (highest impact first)

| # | Issue | Impact | Why |
|---|-------|--------|-----|
| 1 | **Notification waterfall: 15-20 DB queries on mount** | Critical | Every authenticated page load fires ~20 sequential DB requests. On a 200ms-latency connection, that's 4+ seconds of blocking network time before notifications render — and it competes with page content for bandwidth. |
| 2 | **Welcome page blocks on GIF + 3s timer** | Critical | First-time visitors on slow connections see a spinner for potentially 10+ seconds (GIF download + 3s forced wait). This is the worst possible first impression. |
| 3 | **Favicon loaded 5 times (1.4MB wasted)** | High | 1.4MB of wasted bandwidth on every uncached page load. On a 1Mbps connection that's 11+ seconds of unnecessary downloading competing with critical resources. |
| 4 | **lucide-react full library: 161KB** | High | Single largest script, blocking FCP. Tree-shaking this would reduce it to ~10-20KB for the icons actually used. |
| 5 | **TheRiver: 3-step serial query waterfall** | High | The main feed page requires 3 serial network round-trips before showing any posts. Each RPC call on a slow connection adds 300-500ms. |
| 6 | **xcrol-logo.png is 326KB** | Medium-High | Second largest resource. Loads during the Welcome animation reveal — adds hundreds of ms on slow connections. |
| 7 | **notification-resolver.ts: deep query chains** | Medium-High | Up to 4 sequential queries per notification type, multiplied across 7 notification types. Compounds the notification waterfall issue above. |
| 8 | **favicon.png is 295KB** | Medium | Even loaded once, a 295KB favicon is absurd. It should be 2-5KB. |
| 9 | **AppHeader loads for unauthenticated users** | Medium | Forces import of NotificationBell, UserMenu, village-activity hook, and their transitive dependencies — all unused on the Welcome/Auth pages. Adds to the module waterfall. |
| 10 | **useVillageActivityCount polls every 5 min** | Low-Medium | Creates recurring background load. On slow connections, the 2 sequential queries (500-row fetch) can interfere with foreground requests. Not a first-load issue but degrades ongoing performance. |

---

### Implementation Plan

**Phase 1 — Quick wins (items 1-4 by ease):** Remove duplicate favicon links, compress favicon.png and xcrol-logo.png, conditionally render AppHeader internals.

**Phase 2 — Medium effort (items 5-8 by ease):** Extend polling interval, create consolidated notification RPC, move notification resolution server-side, fix Welcome page blocking behavior.

**Phase 3 — Larger refactors (items 9-10 by ease):** Fix lucide-react bundling, extend River RPC to include reactions/replies inline.

