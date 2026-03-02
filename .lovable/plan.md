

## Fix: Toast "View" Button Not Navigating to Messages

### Problem
When users log in and have unread messages, a Sonner toast popup appears saying "You have X unread messages" with a "View" button. Clicking "View" does nothing -- the toast dismisses but no navigation occurs.

This happens because Sonner's `action.onClick` fires synchronously during toast dismissal, and React Router's `navigate()` call gets swallowed during that process.

### Root Cause
In `src/components/NotificationBell.tsx` (lines 58-64), the toast action uses:
```
action: { label: "View", onClick: () => navigate("/messages") }
```
Sonner dismisses the toast on action click, and the `navigate()` call from React Router conflicts with this dismissal timing.

### Fix (single file: `src/components/NotificationBell.tsx`)

Wrap the `navigate()` calls inside the toast action handlers in a `setTimeout(..., 0)` to defer navigation until after Sonner finishes dismissing the toast. This ensures the React Router navigation fires on the next tick.

**Line 61** -- change:
```typescript
action: { label: "View", onClick: () => navigate("/messages") },
```
to:
```typescript
action: { label: "View", onClick: () => setTimeout(() => navigate("/messages"), 0) },
```

**Line 78** -- apply the same fix to the reference toast:
```typescript
action: { label: "View", onClick: () => setTimeout(() => navigate("/profile"), 0) },
```

### What does NOT change
- No styling changes
- No other files modified
- No database or backend changes
- Toast appearance and timing remain identical
- All other notification behavior is untouched

