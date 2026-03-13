

## Fix RSS Feed Item Display

### Problems identified

1. **Missing description** — The RPC only passes `ri.title` as `content`. The RSS item's summary/description (`rss_feed_items.content` column) is discarded, so RSS cards show only a bare headline with no context.

2. **Headline rendered as plain body text** — RSS titles are displayed through `MentionText` which scans for `@username` patterns. News headlines containing `@` get incorrectly turned into profile links.

3. **Crash risk on malformed links** — Line 117 does `new URL(entry.link)` which throws if the link is empty or invalid. RSS feeds sometimes have empty or relative links.

4. **LinkPreview called unnecessarily** — The `LinkPreview` component only supports PixelFed/PeerTube URLs. For RSS items (which are mostly news sites), it always returns null but still invokes the check.

### Changes

**1. Database migration — include RSS description in the RPC output**

Update `get_river_entries` to concatenate the RSS title and description into the `content` field, separated by a newline. Format: `"**Title**\n\nDescription text..."` so the title stands out visually. Alternatively, keep title as content and add description via a separate approach — but since the return signature is fixed, concatenation is simplest.

Revised RSS select:
```sql
COALESCE(ri.title, 'Untitled') || CASE 
  WHEN ri.content IS NOT NULL AND ri.content != '' 
  THEN E'\n\n' || ri.content 
  ELSE '' 
END AS content
```

**2. RiverEntryCard — RSS-specific rendering**

For RSS items (`isRss === true`):
- Render the first line (title) as a bold clickable link to `entry.link` instead of plain text through `MentionText`
- Render remaining lines (description) as muted secondary text below
- Skip `LinkPreview` entirely for RSS items
- Wrap the `new URL()` call in a try/catch to prevent crashes on malformed links
- Show just the hostname safely with a fallback

**3. No structural changes** — same card component, same RPC signature, just smarter conditional rendering for the `isRss` path.

