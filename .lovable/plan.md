

## Add More Trust Levels + Public Option for Groups

### Overview

Currently, group trust levels are limited to four options (Wayfarer, Companion, Oath Bound, Blood Bound). This change expands the dropdown to include all friendship tiers plus a new "public" option that allows any authenticated Xcrol user to view and join the group, regardless of friendship status.

### Changes

---

### 1. Update `friendship-labels.ts` -- Add "public" label

Add a `"public"` entry to `friendshipLevelLabels` so `getFriendshipLabel("public")` returns a proper label like "Public (Any Xcrol Member)". This keeps the label system centralized.

---

### 2. Update `TRUST_LEVELS` arrays in two files

**Files:** `src/components/CreateGroupDialog.tsx` and `src/components/group/GroupSettingsTab.tsx`

Expand the `TRUST_LEVELS` array from:
```text
["friendly_acquaintance", "buddy", "close_friend", "family"]
```
to:
```text
["public", "friendly_acquaintance", "buddy", "close_friend", "secret_friend", "family"]
```

This adds:
- **public** -- any Xcrol user can see content and join (new, listed first)
- **secret_friend** (Invisible Ally) -- between the existing tiers

Note: `secret_enemy` and `not_friend` are excluded since they are adversarial/non-friendship levels that don't make sense for group access gating.

---

### 3. Update default trust level for new groups

In `CreateGroupDialog.tsx`, change the default `trustLevel` state from `"friendly_acquaintance"` to `"public"` so new groups default to being open to all Xcrol members.

---

### 4. Update `GroupHeader.tsx` badge display

No structural change needed -- it already calls `getFriendshipLabel(group.trust_level)`, so the new "public" label will render automatically.

---

### 5. Database default update (migration)

Update the `groups` table column default from `'friendly_acquaintance'` to `'public'` so any future groups created default to public trust level:

```sql
ALTER TABLE public.groups 
  ALTER COLUMN trust_level SET DEFAULT 'public';
```

No data migration is needed -- existing groups keep their current trust_level values.

---

### Technical Notes

- The trust_level column is `text`, not an enum, so no enum alteration is needed
- Trust level is currently cosmetic (not enforced by RLS on join), so this change is purely about UI options and labeling
- The "public" label entry is added to the centralized `friendship-labels.ts` so it works everywhere `getFriendshipLabel()` is called

### Files Summary

| File | Action |
|------|--------|
| `src/lib/friendship-labels.ts` | Add "public" entry to labels |
| `src/components/CreateGroupDialog.tsx` | Expand TRUST_LEVELS, change default to "public" |
| `src/components/group/GroupSettingsTab.tsx` | Expand TRUST_LEVELS |
| Migration SQL | Update column default to 'public' |

