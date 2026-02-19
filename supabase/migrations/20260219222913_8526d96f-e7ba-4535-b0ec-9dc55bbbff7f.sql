
-- Create groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  avatar_url text,
  trust_level text NOT NULL DEFAULT 'friendly_acquaintance',
  creator_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member', -- 'admin', 'co_admin', 'member'
  status text NOT NULL DEFAULT 'active', -- 'active', 'pending' (for join requests), 'invited'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_posts table
CREATE TABLE public.group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_posts_updated_at BEFORE UPDATE ON public.group_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: check if user is group admin or co_admin
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role IN ('admin', 'co_admin')
    AND status = 'active'
  );
$$;

-- Helper: check if user is active member
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND status = 'active'
  );
$$;

-- Helper: check if viewer meets group trust level via friendship with creator
CREATE OR REPLACE FUNCTION public.meets_group_trust_level(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id uuid;
  v_trust_level text;
  v_friendship friendship_level;
BEGIN
  SELECT creator_id, trust_level INTO v_creator_id, v_trust_level
  FROM public.groups WHERE id = p_group_id;
  
  -- Creator always passes
  IF p_user_id = v_creator_id THEN RETURN true; END IF;
  
  -- Members always pass
  IF is_group_member(p_group_id, p_user_id) THEN RETURN true; END IF;
  
  -- Check friendship with creator against trust level
  SELECT f.level INTO v_friendship
  FROM public.friendships f
  WHERE f.user_id = v_creator_id AND f.friend_id = p_user_id
  LIMIT 1;
  
  IF v_friendship IS NULL THEN RETURN false; END IF;
  
  RETURN CASE v_trust_level
    WHEN 'close_friend' THEN v_friendship IN ('close_friend', 'secret_friend')
    WHEN 'buddy' THEN v_friendship IN ('close_friend', 'buddy', 'secret_friend')
    WHEN 'friendly_acquaintance' THEN v_friendship IN ('close_friend', 'buddy', 'friendly_acquaintance', 'secret_friend')
    WHEN 'family' THEN v_friendship = 'family'
    ELSE false
  END;
END;
$$;

-- GROUPS POLICIES

-- Anyone can view group public info (name, description, avatar)
CREATE POLICY "Anyone can view groups" ON public.groups
FOR SELECT USING (true);

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups" ON public.groups
FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Admins can update their groups
CREATE POLICY "Group admins can update groups" ON public.groups
FOR UPDATE USING (is_group_admin(id, auth.uid()));

-- Creator can delete group
CREATE POLICY "Creator can delete group" ON public.groups
FOR DELETE USING (auth.uid() = creator_id);

-- GROUP_MEMBERS POLICIES

-- Members can view other active members; admins can see all (including pending)
CREATE POLICY "Members can view group members" ON public.group_members
FOR SELECT USING (
  is_group_member(group_id, auth.uid())
  OR is_group_admin(group_id, auth.uid())
  OR (user_id = auth.uid())
);

-- Users can request to join (insert with status 'pending')
CREATE POLICY "Users can request to join groups" ON public.group_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND (
    -- Self-request (pending)
    status = 'pending'
    -- Or admin inviting someone
    OR is_group_admin(group_id, auth.uid())
  )
);

-- Admins can update members (approve, promote, etc.)
CREATE POLICY "Group admins can update members" ON public.group_members
FOR UPDATE USING (
  is_group_admin(group_id, auth.uid())
  OR (auth.uid() = user_id) -- users can update their own (e.g. leave)
);

-- Admins can remove members; users can remove themselves
CREATE POLICY "Admins or self can delete members" ON public.group_members
FOR DELETE USING (
  is_group_admin(group_id, auth.uid())
  OR auth.uid() = user_id
);

-- GROUP_POSTS POLICIES

-- Posts visible to active members who meet trust level
CREATE POLICY "Members can view group posts" ON public.group_posts
FOR SELECT USING (is_group_member(group_id, auth.uid()));

-- Active members can create posts
CREATE POLICY "Members can create group posts" ON public.group_posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND is_group_member(group_id, auth.uid())
);

-- Users can update own posts
CREATE POLICY "Users can update own group posts" ON public.group_posts
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete own posts; admins can delete any
CREATE POLICY "Users or admins can delete group posts" ON public.group_posts
FOR DELETE USING (
  auth.uid() = user_id
  OR is_group_admin(group_id, auth.uid())
);
