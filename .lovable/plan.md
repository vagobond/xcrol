

## Create Isolated `/map` Page with Interactive World Map

A new standalone page at `/map` with an interactive SVG landscape map. Completely isolated — no existing files are modified except `App.tsx` (one new route line).

### What Gets Built

An illustrated fantasy-style SVG map where each location is a clickable region:
- **YOU** (Tree of Life, bottom center) → `/profile`
- **The River** (winding water, center) → `/the-river`
- **The World** (globe/compass, right) → `/irl-layer`
- **The Forest** (trees on hills, upper left) → `/the-forest`
- **The Brooks** (small streams off river) → `/the-forest?tab=brooks`
- **The Village** (cluster of houses) → `/the-village`
- **The Town** (buildings) → `/the-town`
- **The Strata** (layered terrain) → `/settings`
- **The Castle** (mountain peak, greyed out) → disabled, "Coming Soon"

Each region has: hover glow effects, click navigation, tooltip descriptions matching the Powers page, keyboard accessibility.

### Files

1. **Create `src/components/WorldMap.tsx`** — Self-contained SVG map component with:
   - Inline SVG landscape (sky gradient, hills, river path, trees, buildings)
   - Each location as a `<g>` with hover CSS transitions (glow, slight scale)
   - `useNavigate()` click handlers
   - `<text>` labels for each location
   - Responsive via `viewBox`, capped at ~900px wide
   - Dark/light theme support using CSS variables

2. **Create `src/pages/Map.tsx`** — Simple page wrapper rendering `<WorldMap />` with a "Back to Powers" link

3. **Edit `src/App.tsx`** — Add one lazy import and one `<Route>` for `/map` (protected). No other changes.

### Isolation Guarantee
- Powers page is untouched
- No shared components are modified
- Only change to existing code is adding the route in App.tsx
- If it doesn't work, delete `WorldMap.tsx`, `Map.tsx`, and remove the one route line

