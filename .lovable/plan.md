

## Update Getting Started Guide

The Getting Started page is missing many recently shipped features. I'll add new sections and update outdated ones, keeping the existing structure and tone.

### New sections to add

1. **Notifications — Bell, Village & World** (after Messaging section)
   - Bell: personal/social (friend requests, references, mentions, river replies, brook activity, messages)
   - Village icon: all group activity (posts, comments, reactions)
   - World icon: IRL Layer activity (nearby hometowns, hosting/meetup/introduction requests)
   - "Unread only / All recent" toggle
   - Forest still surfaces introductions

2. **The Forest — Friends Hub** (before "References & Trust")
   - Centralized friends, requests, introductions, blocked users
   - Ask for Introduction flow, references shown on requests
   - Single nudge rule

3. **The Castle** (after Earning Points)
   - Mysterious teaser; shows progress toward unlock criteria (points, friends, accepted invites)
   - Reachable from Powers; entry earned over time

4. **NOSTR Identity & Federation** (after Decentralized Media Hosting)
   - Optional npub stored on profile, nsec in IndexedDB only
   - Auto-publish public Xcrol entries as kind 1 to default relays
   - NIP-05 discovery via @username at xcrol.com
   - Disable cleanly resets local + DB flags

5. **Mini Games** (expand existing Adventure Hub section)
   - Add Dream Trip (20-step adventure visiting users' hometowns)
   - Add Rough Living
   - Keep Every Country & Cure to Loneliness

6. **The River — additions** (update existing section)
   - Real-time updates with "New post" banner
   - Threaded replies (3 levels) with emoji reactions
   - RSS feed integration
   - Shareable public posts with rich OG previews

7. **The Brook — additions** (small update)
   - Mention NOSTR NIP-17 bridge for Brook participants who opt in

8. **Custom Usernames** (small standalone block under Profile)
   - Immutable lowercase @handles, profile at xcrol.com/@username

9. **Weekly Digest Email** (under Settings & Notifications)
   - Opt-in Monday digest of past week's activity
   - Toggle in Settings → Notifications

10. **PWA Install** (small mention with link to /install-app)

11. **Data Sovereignty / Export** (small block in Settings section)
    - Download My Data (GDPR-compliant export)

### Sections to update

- **Friendship Levels**: align labels with current trust tiers (Blood Bound = Family with orange; Wayfarer level for references/meetup access; Shadow Friend wording for Secret Enemy)
- **Meetups & Hosting**: note Wayfarer+ requirement to send requests; reference the 4 reference types match current system
- **Quick Navigation Guide**: add THE FOREST, THE CASTLE, MAP, ADVENTURE HUB
- **Earning Points**: add +1 for brook/group comments per current rules; clarify points unlock The Castle
- **The Town**: confirm category list and "My Listings" via URL search params still accurate

### File touched

- `src/pages/GettingStarted.tsx` — add sections, update existing ones, add icons (`Bell`, `Castle`, `Send`, `Mail`, `Download`, `Smartphone`) where needed

### Notes
- Pure additive content edit; no logic changes
- Keep the collapsible "deep dive" pattern for any new long sections
- Maintain existing visual style (gradient cards for highlight sections, plain cards for standard)

