

## Problem

When an unauthenticated visitor opens a shared post link (`/post/:postId`), the page shows "Post not found" or displays without author info. The root cause is an **RLS policy gap on the `profiles` table**.

### Why it fails

The `SharedPost.tsx` component queries `xcrol_entries` with a join to `profiles`:
```sql
SELECT ... FROM xcrol_entries 
JOIN profiles ON profiles.id = xcrol_entries.user_id
WHERE id = :postId AND privacy_level = 'public'
```

- `xcrol_entries` has an RLS policy: "Anyone can view public entries" — allows anonymous SELECT where `privacy_level = 'public'`. This works.
- `profiles` has **no anonymous-access RLS policy**. All existing policies require `auth.uid() IS NOT NULL`. So the join returns no profile data, and the query likely returns `null` for the whole row, triggering the "Post not found" state.

### The `og-post` edge function works fine
The edge function uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS entirely. So social crawlers (Twitter, Facebook, etc.) get correct OG metadata. But when a **human clicks through** and lands on the SPA page, the client-side query fails because it uses the anon key.

## Fix

**Two changes, both minimal:**

### 1. Database migration — Add anonymous-safe RLS policy on `profiles`

Add a narrow policy that only allows anonymous users to read the three fields needed for shared posts (`display_name`, `avatar_url`, `username`). Since column-level grants already restrict which columns anon can read (the grant from migration `20260220024114` already includes `id`, `display_name`, `avatar_url`, `username` for anon), we just need a **row-level** policy:

```sql
CREATE POLICY "Anon can view profiles for public posts"
ON public.profiles
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.xcrol_entries e
    WHERE e.user_id = profiles.id
    AND e.privacy_level = 'public'
  )
);
```

This only exposes profiles of users who have **at least one public post** — not every profile. Combined with the existing column-level grants, anonymous users can only see `id`, `display_name`, `avatar_url`, `username`, and other non-sensitive columns.

### 2. No code changes needed

`SharedPost.tsx` is already correct. The query, the route, and the UI all work — the only blocker is the missing RLS policy above.

## What this does NOT change

- Authenticated user access remains identical (existing policies unchanged)
- No new columns are exposed to anonymous users (column grants already in place)
- Profiles without any public posts remain invisible to anonymous users
- The `og-post` edge function continues to work as before

