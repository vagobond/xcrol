

## Per-Category Notification Toggles in Settings

### What this adds
Users will be able to individually enable/disable each notification category (river replies, brook interactions, hosting requests, meetup requests, group interactions) from their Settings page. Disabled categories will be filtered out so those notifications never appear in the bell dropdown.

### Database Change

Add 5 new boolean columns to `user_settings`, all defaulting to `true` (opt-out model):

| Column | Controls |
|---|---|
| `notify_river_replies` | Xcrol entry replies and nested reply notifications |
| `notify_brook_activity` | Brook posts, comments, and reactions |
| `notify_hosting_requests` | Hosting request notifications |
| `notify_meetup_requests` | Meetup request notifications |
| `notify_group_activity` | Group post comments, reactions, and comment reactions |

SQL migration:
```text
ALTER TABLE public.user_settings
  ADD COLUMN notify_river_replies boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_brook_activity boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_hosting_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_meetup_requests boolean NOT NULL DEFAULT true,
  ADD COLUMN notify_group_activity boolean NOT NULL DEFAULT true;
```

No RLS changes needed -- existing policies already allow users to SELECT/UPDATE/UPSERT their own row.

### Frontend Changes

**1. `src/components/settings/useSettingsData.ts`**
- Add the 5 new fields to the `UserSettings` interface and `DEFAULT_SETTINGS` object.
- Update `loadUserSettings` and `handleSettingChange` to include them (they already handle the full settings object generically, so this is just adding keys).

**2. `src/components/settings/NotificationsPrivacySection.tsx`**
- Add a new sub-section under the existing "Notifications" card with 5 toggle switches, one per category:
  - "Xcrol Replies" -- replies to your daily entries and comments
  - "Brook Activity" -- posts, comments, and reactions in your brooks
  - "Hosting Requests" -- when someone requests to stay with you
  - "Meetup Requests" -- when someone requests to meet up
  - "Group Activity" -- comments and reactions on your group posts

**3. `src/hooks/use-notifications.ts`**
- After loading interaction notifications from the `notifications` table, fetch the user's settings and filter out notifications whose `type` maps to a disabled category.
- Mapping:
  - `river_reply`, `river_reply_reply` -> `notify_river_replies`
  - `brook_post`, `brook_comment`, `brook_reaction` -> `notify_brook_activity`
  - `hosting_request` -> `notify_hosting_requests`
  - `meetup_request` -> `notify_meetup_requests`
  - `group_comment`, `group_reaction`, `group_comment_reaction` -> `notify_group_activity`
- The notification count will automatically reflect only enabled categories.

### What stays unchanged
- The database triggers still fire and insert all notifications regardless of settings (preserving a complete audit trail).
- Existing notification types (friend requests, pending friendships, messages, references) are unaffected -- they use separate loading logic and are not filtered by these new toggles.
- No changes to any page components, routing, or other settings sections.
- The two existing toggles ("Email Notifications" and "Friend Request Alerts") remain as-is.

### Files touched (summary)
- 1 new migration file (ALTER TABLE)
- `src/components/settings/useSettingsData.ts` -- add 5 fields
- `src/components/settings/NotificationsPrivacySection.tsx` -- add 5 toggle rows
- `src/hooks/use-notifications.ts` -- filter interaction notifications by settings

