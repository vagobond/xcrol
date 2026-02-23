

## Fix: Only publish public posts to NOSTR

### Problem
When a user has NOSTR auto-publish enabled, every Xcrol post is broadcast to NOSTR relays as a public kind-1 note -- regardless of the privacy level chosen (Private, Oath Bound, Blood Bound, etc.). This leaks content the user intended to keep restricted.

### Solution
Add a single condition check: only run the NOSTR publishing code when `privacyLevel === "public"`.

### Technical Details

**File:** `src/components/XcrolEntryForm.tsx`

Around line 119, change:
```typescript
// BEFORE (publishes everything)
if (isNostrPublishEnabled() && nostrPrivateKey) {
```

To:
```typescript
// AFTER (only public posts)
if (privacyLevel === "public" && isNostrPublishEnabled() && nostrPrivateKey) {
```

That is the only change required. No other files need modification.

