

## Make "Request to Join" Optional for Village Groups

### Overview

Currently every group requires admin approval before a user can post. This change adds a toggle in Group Settings so admins can make their group "open" (anyone can join instantly) or "managed" (requires approval, the current behavior). The default for new groups will be **open**.

### Database Changes

**Add column to `groups` table:**

```text
groups.require_approval  BOOLEAN  NOT NULL  DEFAULT false
```

- `false` (default) = open group, anyone joins instantly as active member
- `true` = managed group, join requests go to pending (current behavior)

**Update RLS policy on `group_members` INSERT:**

The current INSERT policy forces `status = 'pending'`. It needs to also allow `status = 'active'` when the group has `require_approval = false`:

```text
Current:  status must be 'pending' (or admin self-insert)
New:      status can be 'active' IF group.require_approval = false
          status must be 'pending' IF group.require_approval = true
```

**Update RLS policies on `group_posts` and related tables:**

The `is_group_member()` function already checks for `status = 'active'`, so once a user joins as active they can post immediately -- no changes needed to post/comment/reaction policies.

### Frontend Changes

**1. `use-groups.ts` -- useJoinGroup hook**

Check the group's `require_approval` flag before inserting:
- If `false`: insert with `status: 'active'`, show toast "Joined group!"
- If `true`: insert with `status: 'pending'`, show toast "Join request sent!" (current behavior)

Update the `Group` interface to include `require_approval: boolean`.
Update `useUpdateGroup` to accept `require_approval` in the updates object.

**2. `GroupSettingsTab.tsx` -- Add toggle**

Add a Switch component labeled "Require approval to join" with helper text explaining the behavior. Wired to the `require_approval` field and included in the save payload.

**3. `GroupHeader.tsx` -- Update button label**

When `require_approval` is `false`, change the button from "Request to Join" to "Join Group". The join action will immediately make the user an active member.

**4. `GroupProfile.tsx` -- Conditional Requests tab**

The "Requests" tab already only shows when there are pending members, so no change needed. When a group is open, there will simply be no pending members.

### Technical Details

**Migration SQL:**

```sql
ALTER TABLE public.groups
  ADD COLUMN require_approval boolean NOT NULL DEFAULT false;

-- Update the group_members INSERT policy to allow direct active join for open groups
DROP POLICY IF EXISTS "Users can request to join groups" ON public.group_members;

CREATE POLICY "Users can request to join groups" ON public.group_members
  FOR INSERT WITH CHECK (
    (auth.uid() = user_id)
    AND (
      -- Admin self-insert (group creation)
      (
        status = 'active' AND role = 'admin'
        AND EXISTS (
          SELECT 1 FROM groups WHERE groups.id = group_members.group_id AND groups.creator_id = auth.uid()
        )
      )
      -- Open group: join directly as active
      OR (
        status = 'active' AND role = 'member'
        AND EXISTS (
          SELECT 1 FROM groups
          WHERE groups.id = group_members.group_id AND groups.require_approval = false
        )
        AND NOT is_group_member(group_id, auth.uid())
      )
      -- Managed group: request as pending
      OR (
        status = 'pending'
      )
      -- Existing admin adding
      OR is_group_admin(group_id, auth.uid())
    )
  );
```

**Frontend join logic change (pseudocode):**

```text
// In useJoinGroup, accept the group object instead of just groupId
if (group.require_approval) {
  insert with status: 'pending'  ->  toast "Join request sent!"
else
  insert with status: 'active'   ->  toast "Joined group!"
```

### What stays the same

- Groups that already exist will default to `require_approval = false` (open), matching the requested default
- Trust level badge remains as a cosmetic indicator
- Admin approval flow for managed groups is unchanged
- All existing RLS on posts, comments, and reactions works as-is since it checks `is_group_member()` which looks for `status = 'active'`

