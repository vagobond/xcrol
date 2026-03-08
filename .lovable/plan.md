

# Plan: Shareable Public Xcrol Posts

## What the user wants
- Authors can share a direct link to their own public Xcrol posts outside the platform
- Only the post author can share, and only if `privacy_level = 'public'`
- The shared link shows the single post to unauthenticated visitors
- Replies are hidden from the public view
- Below the post, show a signup CTA with a link to the GoFundMe video
- URL format: `https://xcrol.com/post/<post-id>`

## Current state
- `/the-river` is behind `ProtectedRoute` — no public access
- `/xcrol/:username` is also protected
- There is no public single-post page
- The `xcrol_entries` table has RLS; public entries are queryable by authenticated users but there's no anon-friendly policy for `privacy_level = 'public'`
- An `og-profile` edge function already exists for OG meta tags on profiles

## Implementation

### 1. Database: Add RLS policy for anonymous access to public posts
A single new SELECT policy on `xcrol_entries` allowing anon reads of `privacy_level = 'public'` rows:
```sql
CREATE POLICY "Anyone can view public xcrol entries"
ON public.xcrol_entries FOR SELECT
TO anon, authenticated
USING (privacy_level = 'public');
```
This is safe — it only exposes rows the author explicitly marked public.

### 2. New page: `src/pages/SharedPost.tsx`
- Route: `/post/:postId` (public, NOT behind `ProtectedRoute`)
- Fetches the single `xcrol_entries` row by ID + joins `profiles` for author display name/avatar/username
- If post not found or not public → shows "Post not found" message
- Renders the post content, date, author info, and link preview
- Does NOT render replies or reactions
- Below the post, renders a CTA card:
  - "Join Xcrol" heading with brief copy
  - Sign up button → `/auth`
  - "What makes Xcrol different?" link → `https://www.gofundme.com` (the specific campaign URL, to be confirmed with user)

### 3. Share button: Only for authors on public posts
- In `RiverEntryCard.tsx`: Add a share/copy-link icon button that appears only when `entry.user_id === currentUserId && entry.privacy_level === 'public'`
- Copies `https://xcrol.com/post/<entry.id>` to clipboard with a toast
- Same button in `MyXcrol.tsx` entries list for public entries only

### 4. OG meta tags (optional enhancement)
- Create an `og-post` edge function (similar to existing `og-profile`) that returns HTML with OG tags for the post content, so links shared on X/social media get a rich preview
- Or handle it with `react-helmet-async` in `SharedPost.tsx` for basic client-side meta tags (simpler, but less reliable for social crawlers)

### 5. Route registration in `App.tsx`
```tsx
<Route path="/post/:postId" element={<SharedPost />} />
```
Placed with other public routes (like `/terms`, `/privacy`), NOT wrapped in `ProtectedRoute`.

## What stays untouched
- All existing River, Xcrol, and profile pages
- All existing RLS policies (only adding one new one)
- No changes to existing components' behavior — only additive share button

## Open questions for user
- Exact GoFundMe campaign URL to link to
- Whether to invest in an OG edge function for rich social previews, or start with basic client-side meta tags

