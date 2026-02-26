

## Add PixelFed/PeerTube Rich Link Previews to Brook Posts and Group Posts

### Overview

Brook post cards and group post cards currently show links as plain text URLs. This change adds the same rich media previews (PixelFed images, PeerTube video thumbnails/embeds) that already work in The River, by reusing the existing `LinkPreview` component. No database, edge function, or other component changes are needed.

### Changes

---

### 1. `src/components/BrookPostCard.tsx`

- Import `LinkPreview` from `@/components/LinkPreview`
- Inside the `{post.link && (...)}` block, add `<LinkPreview url={normalizedUrl} />` above the existing hostname anchor
- Normalize the URL the same way already done for the anchor (prepend `https://` if no protocol)

---

### 2. `src/components/group/GroupPostsTab.tsx`

- Already imports `LinkPreview` and renders it for group posts
- No changes needed -- group posts already have rich link previews

---

### What stays the same

- `LinkPreview` component -- no changes
- `link-preview` edge function -- no changes
- `RiverEntryCard` -- untouched
- All other pages, components, database schema -- untouched

### Risk

Zero. `LinkPreview` is fully self-contained: it checks the URL against known PixelFed/PeerTube domains client-side and renders `null` for non-matching URLs, so non-media links display exactly as before.

