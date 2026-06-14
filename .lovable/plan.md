
# Brainstorm: Making Hearth Surf Better

Below are ideas inspired by three competitors — picked to fit Xcrol's existing systems (friendship tiers, references, hometown privacy, Wayfarer+ gating, Forest/Village social layer). Nothing here is committed yet — this is for you to react to.

## Current Hearth Surf in a sentence

Today: open-to-hosting toggle, accommodation type, max guests, min friendship level, compensation preferences, a hosting request dialog with arrival/departure/guests/message, and a 3-tab UI (Search / Requests / My Space). References exist platform-wide but are not specifically tied to stays.

---

## Tier 1 — High impact, fits Xcrol naturally

1. **Stay-tied references (host + guest pair)**
   When a hosting request status flips to `accepted` and the stay date passes, prompt both sides for a "Stay Reference" (a new `reference_type`). Show stay-references separately on the profile under Hearth Surf so a traveler can see "hosted 12 people, all positive" at a glance. *(Borrowed from CouchSurfing's stay vs personal split.)*

2. **Simultaneous reference reveal**
   For stay references, hide both sides until both submit, or auto-reveal after 14 days. Kills retaliation reviews. *(Workaway.)*

3. **Private safety feedback channel**
   On the same post-stay prompt, an optional "Something felt off — only admins should see this" field. Routes to the existing admin Flagged tab, never public. *(Couchers + CouchSurfing.)*

4. **Host availability calendar**
   Replace the binary "open to hosting" with date-range blocks: blackout dates, recurring weekly unavailability (e.g. "never Mondays"), and an auto-block when a request is accepted for those dates. Search filters by dates available. *(CouchSurfing day-of-week + Couchers roadmap.)*

5. **Activeness probe**
   If a host hasn't logged in for 60 days, auto-email "Still hosting?" — one click confirms or pauses. Paused hosts are hidden from search until they return. Keeps search results trustworthy. *(Couchers.)*

6. **Trip / Visit context**
   Before sending a hosting request, the traveler creates (or picks) a "Trip" — destination, dates, who's traveling, why. Trips are reusable across multiple hosting requests in the same city and surface in the Forest (friends can see "Alex is heading to Lisbon in March") and optionally trigger introductions. Aligns with Xcrol's social-first ethos. *(CouchSurfing, deepened by the Forest.)*

## Tier 2 — Nice unlocks that match the existing personality

7. **Host map pin jitter**
   Right now hometown coords are already rounded to 1 decimal — for *active hosts* shown in Hearth search, jitter by an additional 2–10 km randomized per session, and only reveal precise address inside an accepted request thread. *(Couchers privacy model.)*

8. **Companion / Buddy finder**
   Lightweight "I'm going to X around date Y, anyone want to travel together?" board — friend-of-friend visible by default, public optional. Reuses Town's URL-param classifieds pattern. *(Workaway travel buddy.)*

9. **Couple / group traveler profiles on the request**
   Extend the request dialog with companion names (free text or @mentions), ages, relationship — hosts often want to know if it's 2 partners vs 4 strangers. Already have `num_guests`; add structured companion data.

10. **Host stay history + stats block**
    On a host's profile show: "Hosted 23 stays · 21 positive · last guest Mar 2026 · responds in ~6h". A computed `community_standing` style aggregate, but per Hearth-Surf so the global score isn't polluted. *(Couchers community standing, scoped.)*

11. **Pre-message gating already exists via friendship tiers** — but make it visible to the requester: show "This host accepts requests from Wayfarer or above" *before* opening the dialog, so people aren't surprised.

12. **Same-day / last-minute toggle**
    A single switch — "Open to last-minute requests (<48h)" — surfaces a "Last-minute hosts near me" view. Great for the Brook/messages cross-promo.

## Tier 3 — Bigger swings, more thinking required

13. **Work-exchange compensation type ("Skill swap")**
    You already have `monetary / food / hangout / friendship / fwb` in compensation types. Add `skills_exchange` with a tag list (cooking, gardening, language tutoring, code, photography). Lets Xcrol cover the Workaway use case without becoming Workaway. Hosts can require it; travelers list their offered skills on the request.

14. **Emergency tools block in the request thread**
    Once a stay is accepted, the message thread shows a small fixed footer: "Need help? · Find nearby accommodation · Contact host's emergency reference · Report safety issue". Cheap to build, huge trust signal. *(CouchSurfing safety tools.)*

15. **Private emergency contact field**
    Optional field in Settings → never visible to anyone except admins on a flagged stay. Used only if a stay goes sideways and admins need to reach next-of-kin.

16. **Stay-completion → Forest/River prompt**
    After a successful stay, prompt both parties: "Share a moment from your stay?" → composes a River entry tagging the other person (with the existing mentions system). Turns Hearth Surf into a content engine for the Forest and amplifies the social-trust loop unique to Xcrol.

17. **Public host pages with OG previews**
    `xcrol.com/@host/hearth` — a shareable, OG-rich, partially-public host card (no exact location, no contact). Helps travelers send a single link to friends and helps SEO surface real hosts. Reuses the existing `og-profile` edge function pattern.

---

## What I'd cut from the inspiration list

- **Manual staff review of every reference** (Workaway) — doesn't scale and conflicts with Xcrol's lean-admin posture.
- **Paid premium tier for search filters** (Workaway Plus) — Wayfarer+ already covers gating; better to ship filters for everyone.
- **Trip creation as a hard prerequisite** (CouchSurfing) — make it optional context, not a gate, or it becomes friction.

---

## Suggested first slice (if you want one)

A coherent v1.1 of Hearth Surf:
- Stay-tied references with simultaneous reveal + private channel (#1, #2, #3)
- Host availability calendar with auto-block on acceptance (#4)
- Activeness probe (#5)
- Stay-completion → River prompt (#16)

These four together would make Hearth Surf measurably more trustworthy, accurate, and social — without inventing new domains.

---

**Want me to**
(a) turn one of these tiers into an implementation plan,
(b) prototype the "stay reference + simultaneous reveal" flow specifically, or
(c) something else?
