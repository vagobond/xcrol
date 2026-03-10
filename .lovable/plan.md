

## Problem

When you leave The River tab and come back, the entire feed reloads from scratch and you lose your scroll position. This happens because `TheRiver.tsx` calls `loadEntries()` unconditionally on mount (line 73-77), and the page component gets re-rendered when focus returns.

The `refetchOnWindowFocus: false` setting only applies to React Query — but The River doesn't use React Query. It uses raw `useState` + `useEffect` + direct Supabase calls, so every re-render triggers a fresh data fetch, wiping the entries and resetting scroll.

## Fix (single file: `src/pages/TheRiver.tsx`)

**Add a visibility-aware guard** so the data only loads on the first visit or when the filter changes — not on every tab return:

1. **Track whether initial load has happened** using a `useRef` flag (e.g. `hasLoadedRef`). Set it to `true` after the first successful load.

2. **Modify the `useEffect`** on line 73 to skip calling `loadEntries()` if data has already been loaded and the filter hasn't changed. When the filter changes, reset the flag and reload.

3. **Preserve scroll position** — since we're no longer clearing and re-fetching entries, the DOM stays intact and scroll position is naturally preserved.

Concretely:
- Add `const hasLoadedRef = useRef(false)` and `const prevFilterRef = useRef(filter)`
- In the existing useEffect, only call `loadEntries()` if `!hasLoadedRef.current` or if the filter value changed (compare against `prevFilterRef.current`)
- After successful load, set `hasLoadedRef.current = true` and update `prevFilterRef.current`

**No other files are touched.** This is a minimal change confined to the load-guard logic in `TheRiver.tsx`.

