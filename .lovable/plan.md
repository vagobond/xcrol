

# Plan: Enhance Data Sovereignty for Xcrol Users

## What you already have
- OAuth scope controls (users choose what third-party apps can access)
- Granular profile field visibility by friendship level
- Connected apps management with revoke access
- Account deletion request flow
- Blocked users management

## What's missing

### 1. Data Export ("Download My Data")
The most impactful sovereignty feature: let users download everything Xcrol holds about them in a single JSON/ZIP file. This is also a GDPR/privacy law requirement in many jurisdictions.

**What gets exported:**
- Profile info (display name, bio, hometown, etc.)
- All Xcrol diary entries
- Friends list (names + levels)
- Messages (sent and received)
- Brook posts and comments
- Group memberships and posts
- River replies
- References (given and received)
- Social links
- Settings and preferences
- Hosting/meetup preferences
- Town listings

**Implementation:**
- Add a "Download My Data" button in the Settings page under Data & Privacy Controls
- Create a backend function that collects all user data across tables, packages it as a structured JSON file, and returns it for download
- Show a brief loading state while the export is generated

### 2. Activity Log (optional, lighter lift)
A read-only log showing when third-party apps accessed user data (OAuth token usage). This gives users visibility into how their data is being used.

**Implementation:**
- Add an `oauth_access_log` table that records each time a token is used
- Display a simple list in the Connected Apps section showing recent access events

---

## Technical Details

### Data Export Backend Function
- New edge function: `supabase/functions/export-user-data/index.ts`
- Authenticates the requesting user via JWT
- Queries all relevant tables filtered by `user_id`
- Returns a JSON response with all data organized by category
- Frontend triggers the download as a `.json` file

### Data Export Frontend
- New "Download My Data" card in `src/pages/Settings.tsx`
- Button calls the edge function, receives JSON, triggers browser download
- Loading spinner while generating

### Activity Log (if included)
- New migration: `oauth_access_log` table with columns: `id`, `client_id`, `user_id`, `scope_used`, `endpoint`, `accessed_at`
- Update OAuth edge functions to log access events
- New UI section in Connected Apps showing recent access

---

## Recommended approach
Start with **Data Export only** -- it's the highest-value sovereignty feature and stands on its own. The Activity Log can be added later as a follow-up.

## Files to create/modify
- **Create:** `supabase/functions/export-user-data/index.ts` -- backend function to gather and return all user data
- **Modify:** `src/pages/Settings.tsx` -- add Download My Data card
- **Modify:** `src/components/settings/DataPrivacySection.tsx` -- add export button within existing Data & Privacy section (alternative placement)

