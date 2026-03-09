

## Fix: Friend request message truncation

### Problem
In `FriendRequestItem.tsx`, the message is rendered with `truncate` class, which forces single-line display with ellipsis. Users cannot read messages longer than one line.

### Changes

**`src/components/friends/FriendRequestItem.tsx`** (line 98)
- Replace `truncate` with `whitespace-pre-wrap break-words` so the full message displays with word wrapping
- Optionally add `line-clamp-3` if we want to cap at 3 lines with a tooltip for very long messages, but given friend request messages are short (500 char max from the textarea), full display is fine

Single line change: `truncate` → `break-words` on the message `<p>` tag.

