

## RSS Feeds in The River

### Overview

Allow each user to subscribe to RSS feeds that appear in their personal River view. RSS items will be mixed chronologically with friend posts in the main feed, and also available via a dedicated "News" filter. Users can manage feeds from both Settings and directly on The River page.

### Architecture

```text
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  user_rss_   │────▶│  fetch-rss-feeds  │────▶│  rss_feed_   │
│  feeds table │     │  (edge function)  │     │  items table │
└──────────────┘     └──────────────────┘     └──────────────┘
       │                                            │
       │  user manages                              │  mixed into
       │  subscriptions                             │  River query
       ▼                                            ▼
  Settings / River                          get_river_entries
  management UI                             RPC (modified)
```

### Database Changes (2 new tables, 1 RPC update)

**Table `user_rss_feeds`** — stores each user's subscribed RSS sources:
- `id` uuid PK
- `user_id` uuid NOT NULL (references auth.users)
- `feed_url` text NOT NULL
- `feed_name` text (display name, auto-populated from feed title)
- `feed_icon` text (favicon URL, nullable)
- `created_at` timestamptz
- RLS: users can only CRUD their own rows
- Unique constraint on `(user_id, feed_url)`

**Table `rss_feed_items`** — cached RSS items fetched by the edge function:
- `id` uuid PK
- `feed_id` uuid NOT NULL (references user_rss_feeds, cascade delete)
- `user_id` uuid NOT NULL
- `title` text NOT NULL
- `content` text (description/summary)
- `link` text NOT NULL
- `published_at` timestamptz NOT NULL
- `guid` text NOT NULL (RSS item unique ID)
- `created_at` timestamptz
- RLS: users can only SELECT their own items; edge function inserts via service role
- Unique constraint on `(feed_id, guid)` to prevent duplicates

**Modify `get_river_entries` RPC** — add a UNION with `rss_feed_items` when `p_filter = 'all'` or `p_filter = 'rss'`. RSS items will use a synthetic author (feed name + icon) and a special `privacy_level = 'rss'` marker so the UI can render them differently.

### Edge Function: `fetch-rss-feeds`

- Accepts a user_id (or runs for all users with active feeds)
- Fetches each RSS feed URL, parses XML (using a lightweight XML parser)
- Upserts items into `rss_feed_items` (deduplicating by guid)
- Can be called on-demand when a user adds a feed, or scheduled via pg_cron for periodic refresh (e.g., every 30 minutes)
- Uses service role key to bypass RLS for inserts

### Frontend Changes

**1. RSS Management Component (`RssFeedManager`)**
- Form to add a new RSS feed URL (validates URL format)
- List of subscribed feeds with delete button
- Used in both Settings page and as a dialog/sheet on The River page

**2. The River page (`TheRiver.tsx`)**
- Add "News" option to the existing filter dropdown
- Add a small RSS icon/button to open the feed manager
- Modify the `RiverEntry` interface to support an optional `is_rss` flag and `rss_source` metadata
- RSS items render in `RiverEntryCard` with a distinct visual treatment (news icon, source attribution, external link) — no reactions or replies on RSS items

**3. Settings page**
- Add an "RSS Feeds" section (similar to the existing Integrations section) with the `RssFeedManager` component

**4. Filter update**
- Add `{ value: "rss", label: "News Feeds" }` to `FILTER_OPTIONS`
- When filter is "rss", only show RSS items; when "all", mix everything chronologically

### What stays the same

- Existing friend posts, reactions, replies — completely untouched
- The `get_river_entries` RPC for non-RSS filters works identically
- No changes to existing tables or RLS policies

