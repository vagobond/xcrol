

## Convert Group Cards to Links for Right-Click Support

### Problem
Group cards on The Village page use `onClick={() => navigate("/group/slug")}` on a `<Card>` div. This means no `<a>` tag is rendered, so browsers don't offer "Open in new tab" on right-click or middle-click.

### Solution
Wrap each `<Card>` in a React Router `<Link>` component, moving the navigation from `onClick` to a proper `href`.

### Changes (single file: `src/pages/TheVillage.tsx`)

1. Import `Link` from `react-router-dom`
2. Update the `GroupCard` component:
   - Change the `onClick: () => void` prop to `to: string`
   - Wrap the `<Card>` in a `<Link to={to}>` with no underline styling
   - Remove the `onClick` from `<Card>`
3. Update both call sites to pass `to={"/group/" + group.slug}` instead of `onClick`
4. Remove `useNavigate` import (no longer used after this -- but check the Back button still uses it, so keep it)

### What does NOT change
- No styling changes -- cards look identical
- No other files modified
- No database or backend changes
- The Back button keeps using `navigate(-1)` as before
- No new dependencies

