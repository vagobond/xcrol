

## Plan: Make XCROL Breathe

Four interconnected features to make the network feel alive. All use existing Resend setup — no new infrastructure needed.

### 1. Real-Time River
- Migration: `ALTER PUBLICATION supabase_realtime ADD TABLE public.xcrol_entries;` + `REPLICA IDENTITY FULL`
- `src/pages/TheRiver.tsx`: subscribe to `postgres_changes` INSERT events, fetch author profile, prepend with fade-in animation
- "New post" floating banner appears when user is scrolled down; click scrolls to top
- Cleanup channel on unmount; respects current filter

### 2. Landing Page Proof of Life
- New edge function `get-public-stats` (no auth, cached 5 min): returns counts of entries posted today, total users with hometowns, total countries claimed, total brooks active
- `src/pages/Welcome.tsx`: add a subtle stats strip below the CTA — "X moments shared today · Y hometowns across Z countries · N private streams flowing"
- Numbers animate up on mount (count-up effect). All counts are aggregate-only, no PII.

### 3. The Castle Teaser Page
- New route `/the-castle` (protected)
- Mysterious atmospheric page: gates rendered as locked, shows user's progress toward unlock criteria (e.g., points threshold, profile completeness, friend count, accepted invites)
- Progress bars with cryptic labels ("The gatekeepers grow restless...")
- Hint at what's inside without revealing
- `src/pages/Powers.tsx`: change disabled Castle button to navigate to `/the-castle`

### 4. Weekly Digest Emails (using existing Resend)
- Migration: add `weekly_digest_enabled boolean default true` to `user_settings`; create `weekly_digest_log` (user_id, week_number, sent_at) for idempotency
- New edge function `send-weekly-digest` (uses `RESEND_API_KEY` directly, like existing email functions): for each opted-in user, aggregate past 7 days (new friend posts count, unread messages, pending friend requests, new hometowns nearby) and send personalized HTML email
- Settings UI: add toggle in `NotificationsPrivacySection.tsx` + field in `useSettingsData.ts`
- `pg_cron` schedule: Mondays 9am UTC, calls edge function via `pg_net` (cron SQL via insert tool, not migration)
- Email uses inline HTML matching existing `send-welcome-email` brand styling; includes one-click unsubscribe link → `/settings`

### Files Touched
**Created:**
- `supabase/functions/get-public-stats/index.ts`
- `supabase/functions/send-weekly-digest/index.ts`
- `src/pages/TheCastle.tsx`

**Modified:**
- `src/pages/TheRiver.tsx` (realtime)
- `src/pages/Welcome.tsx` (stats strip)
- `src/pages/Powers.tsx` (Castle button enabled)
- `src/App.tsx` (add `/the-castle` route)
- `src/components/settings/NotificationsPrivacySection.tsx` + `useSettingsData.ts`

**Migrations:** realtime publication, `user_settings.weekly_digest_enabled`, `weekly_digest_log` table with RLS  
**Insert tool:** pg_cron schedule (project-specific)

### Notes
- Stats endpoint is public (no auth) — needed for unauthenticated landing page
- Digest email respects `weekly_digest_enabled` and email confirmation status
- No changes to existing functionality; all additive

