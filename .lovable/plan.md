

## Show References and "Ask for Introduction" on Friend Requests

### Overview

When a user receives a friend request, they currently see only the requester's name, avatar, and optional message. This change adds two trust-building features:
1. Display the requester's references (or explicitly note "No references yet") inline with the request
2. Add an "Ask for Introduction" button that finds mutual friends and lets the receiver request a formal introduction before deciding

### Changes

---

### 1. New Component: `FriendRequestReferences`

**File:** `src/components/friends/FriendRequestReferences.tsx` (new)

A small, reusable component that takes a `userId` and fetches their references from `user_references`. Displays:
- A compact summary: "3 references (2 Friendly, 1 Host)" with average rating stars
- A collapsible section showing individual reference excerpts (first ~100 chars of content, author name, type badge)
- If zero references: a clear note "This person has no references yet"

Used in both the NotificationBell's `FriendRequestItem` and The Forest's `ReceivedRequestsSection`.

---

### 2. New Component: `AskIntroductionDialog`

**File:** `src/components/friends/AskIntroductionDialog.tsx` (new)

A dialog triggered by an "Ask for Introduction" button on received friend requests. It:
- Queries for mutual friends: users who are friends with BOTH the receiver and the requester (using two queries on the `friendships` table, intersecting `friend_id` values)
- If mutual friends exist: shows them in a list, lets the receiver select one as the introducer, write a message, and submit an `introduction_requests` row (reusing the existing table and RLS policies)
- If no mutual friends: shows "You have no mutual friends with this person" and disables submission

---

### 3. Update `FriendRequestItem` (notifications)

**File:** `src/components/notifications/FriendRequestItem.tsx`

- Import and render `FriendRequestReferences` below the requester info, passing `request.from_user_id`
- Add an "Ask for Introduction" button next to existing Respond/Block buttons
- The button opens `AskIntroductionDialog` with the requester's user ID and the current user's ID

---

### 4. Update `ReceivedRequestsSection` (The Forest)

**File:** `src/components/friends/FriendRequestSections.tsx`

- Import and render `FriendRequestReferences` below each received request's name/message
- Add an "Ask for Introduction" icon button (using the `UserPlus` or `Users` icon) that opens the `AskIntroductionDialog`
- Pass an `onAskIntro` callback prop from the parent, or handle it inline

---

### 5. Update `NotificationBell` accept dialog

**File:** `src/components/NotificationBell.tsx`

- In the "Accept Friend Request" dialog (shown when user clicks Respond), add the `FriendRequestReferences` component above the friendship level selector so the user can review references before choosing a level

---

### No Database Changes Required

- References are read from the existing `user_references` table (SELECT policy already allows authenticated non-blocked users)
- Introduction requests use the existing `introduction_requests` table and its RLS policies
- Mutual friend lookups use the existing `friendships` table

---

### Technical Details

**Mutual friend query logic:**

```text
1. Fetch receiver's friend IDs:
   SELECT friend_id FROM friendships WHERE user_id = receiverId
   
2. Fetch requester's friend IDs:
   SELECT friend_id FROM friendships WHERE user_id = requesterId
   
3. Intersect to find mutual friends
4. Fetch profiles for mutual friend IDs
```

**References fetch:**

```text
SELECT id, from_user_id, reference_type, rating, content, created_at
FROM user_references
WHERE to_user_id = requesterId
ORDER BY created_at DESC
LIMIT 10
```

Then batch-fetch author profiles via `profiles.id IN (...)`.

**Introduction request insert (reuses existing table):**

```text
INSERT INTO introduction_requests (requester_id, introducer_id, target_id, message)
VALUES (currentUserId, selectedMutualFriendId, fromUserId, userMessage)
```

Note: In this context, the receiver of the friend request becomes the `requester` of the introduction, the mutual friend is the `introducer`, and the person who sent the friend request is the `target`.

### Files Summary

| File | Action |
|------|--------|
| `src/components/friends/FriendRequestReferences.tsx` | Create |
| `src/components/friends/AskIntroductionDialog.tsx` | Create |
| `src/components/notifications/FriendRequestItem.tsx` | Edit |
| `src/components/friends/FriendRequestSections.tsx` | Edit |
| `src/components/NotificationBell.tsx` | Edit |

