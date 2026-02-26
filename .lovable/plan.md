

## Fix: Notification Bell Freezes the Page

### The Problem

The Radix `DropdownMenu` component is modal by default. When opened, it renders an invisible backdrop that captures all pointer events and traps keyboard focus. This makes the rest of the site feel "frozen" until you click the bell again to close it.

### Options

#### Option A: Add `modal={false}` to the DropdownMenu (Simplest)

Set `<DropdownMenu modal={false}>` so the dropdown no longer blocks interaction with the rest of the page. Users can scroll, click links, and interact normally while the notification panel is open. Clicking outside still closes it.

- **Pros:** One-line change. Keeps the existing dropdown component. Matches how most social sites handle notification panels.
- **Cons:** Keyboard focus is no longer trapped inside the dropdown (minor accessibility tradeoff, acceptable for a notification list).
- **Files changed:** `src/components/NotificationBell.tsx` (1 line)

#### Option B: Replace DropdownMenu with a Popover

Swap the `DropdownMenu` for a `Popover` component (already installed via Radix). Popovers are non-modal by default and designed for richer content like notification panels, rather than simple menu item lists.

- **Pros:** Semantically correct for notification content. Non-modal by default. Better suited for scrollable, interactive content. Still closes on outside click.
- **Cons:** Slightly more code to swap. Notification items would need minor style tweaks (remove dropdown-specific hover states, use standard clickable divs).
- **Files changed:** `src/components/NotificationBell.tsx` (swap imports and wrapper elements)

#### Option C: Replace with a Sheet (Slide-out Panel)

Use the existing `Sheet` (drawer) component to slide in a notification panel from the right side. This is the pattern used by Instagram, LinkedIn, and many modern apps.

- **Pros:** More room for content. Feels polished and modern. Works well on mobile. Non-modal scrolling underneath is possible.
- **Cons:** More significant UI change. Takes up more screen space. Requires reworking the layout of notification items.
- **Files changed:** `src/components/NotificationBell.tsx` (larger rewrite), possibly notification item components for layout adjustments.

### Recommendation

**Option A** is the fastest fix and immediately solves the problem. It is literally adding `modal={false}` to one element. If you want a more polished feel later, Option B or C can be done as a follow-up.

### Implementation (Option A)

Change line 157 in `NotificationBell.tsx`:

```text
Before:  <DropdownMenu>
After:   <DropdownMenu modal={false}>
```

That is the entire change. The dropdown will no longer block interaction with the rest of the page.
