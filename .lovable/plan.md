

## Security & Stability Hardening — 8 Changes

### Important Note on Backups
Database structure is version-controlled via migrations. Site files are in git with full history. A data export can be run via the existing `export-user-data` edge function, and a database snapshot can be taken via `pg_dump`. I'll run a `pg_dump` to `/mnt/documents/` before making any changes.

### Changes

**1. Add JWT check to Mapbox token endpoint**
`supabase/functions/get-mapbox-token/index.ts` — Add `createClient` + `getClaims()` auth check so only authenticated users can retrieve the token. Return 401 if missing/invalid.

**2. Strip `javascript:` from markdown link hrefs**
`src/components/MarkdownContent.tsx` — After the `[text](url)` regex replacement, add a sanitization pass that removes any `<a>` tags whose `href` starts with `javascript:` (case-insensitive).

**3. Fix Messages sign-in to pass returnUrl**
`src/pages/Messages.tsx` — Change the "Sign In" button's `onClick` from `navigate("/auth")` to `navigate("/auth?returnUrl=%2Fmessages")` so users return to messages after login.

**4. Add `.limit(50)` to MyXcrol query**
`src/pages/MyXcrol.tsx` line 87 — Append `.limit(50)` to the xcrol_entries query to prevent unbounded fetches.

**5. Change invite code label**
`src/components/InviteCodeGate.tsx` — Change `<Label>` from "Invite Code" to "Invite Code (required for access)".

**6. Add ErrorBoundary around lazy routes**
`src/App.tsx` — Create a simple `ErrorBoundary` class component inline (or in a new file) and wrap the `<Suspense>` block so crashed lazy routes show a friendly fallback instead of a white screen.

**7. Add tooltip to Castle button**
`src/components/WorldMap.tsx` — Add an SVG `<title>` element inside the Castle `<g>` with text like "Unlock by inviting 3 friends who complete their profiles" so it shows on hover.

**8. Wrap `/admin` in ProtectedRoute**
Already done — `/admin` is already inside `<ProtectedRoute>` in App.tsx (line ~89). No change needed. I'll verify and skip.

### Files Created/Modified
- `supabase/functions/get-mapbox-token/index.ts` (edit)
- `src/components/MarkdownContent.tsx` (edit)
- `src/pages/Messages.tsx` (edit)
- `src/pages/MyXcrol.tsx` (edit)
- `src/components/InviteCodeGate.tsx` (edit)
- `src/App.tsx` (edit — ErrorBoundary)
- `src/components/WorldMap.tsx` (edit — tooltip)

### Safety
All changes are additive or minor edits to existing logic. No database schema changes. No shared component APIs are altered. The Mapbox JWT change requires `supabase/config.toml` to keep `verify_jwt = false` (already set) since we validate in-code.

