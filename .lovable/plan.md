
## Improve Messages UX: Auto-Scroll to Newest Messages

### Problem
When opening a conversation thread, messages are displayed oldest-first (chronologically correct for a chat), but the scroll position starts at the top. Users must manually scroll to the bottom to see the latest messages.

### Solution
Add an auto-scroll behavior that scrolls the message container to the bottom when the thread opens and when new messages arrive. This is the standard pattern used by every major messaging app (iMessage, WhatsApp, etc.).

### Changes (single file: `src/components/messages/ThreadDetailView.tsx`)

1. Add a `useRef` for the scroll container
2. Add a `useEffect` that scrolls the container to the bottom:
   - On initial render (thread opens)
   - When `thread.messages.length` changes (new message arrives)
3. Use `scrollTop = scrollHeight` to jump to the bottom instantly on mount, keeping it snappy

### Technical Detail

```text
Before:
  [Message 1 - oldest]  <-- viewport starts here
  [Message 2]
  [Message 3]
  ...
  [Message N - newest]  <-- user must scroll here

After:
  [Message 1 - oldest]
  [Message 2]
  ...
  [Message N - newest]  <-- viewport starts here automatically
```

The scroll container on line 115 (`div.space-y-3.max-h-[60vh].overflow-y-auto`) gets a ref. A `useEffect` sets `ref.scrollTop = ref.scrollHeight` after render.

### What does NOT change
- Message ordering stays chronological (oldest to newest) -- this is correct for chat UX
- No styling changes
- No other files modified
- No database changes
