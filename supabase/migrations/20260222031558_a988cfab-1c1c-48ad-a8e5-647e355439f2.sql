
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- No direct inserts from clients - only triggers
-- (triggers run as SECURITY DEFINER so they bypass RLS)

-----------------------------------------------------
-- TRIGGER FUNCTIONS
-----------------------------------------------------

-- 1. River reply: notify entry author or parent reply author
CREATE OR REPLACE FUNCTION public.notify_river_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_target_user_id uuid;
BEGIN
  IF NEW.parent_reply_id IS NOT NULL THEN
    -- Nested reply: notify parent reply author
    SELECT user_id INTO v_target_user_id
    FROM river_replies WHERE id = NEW.parent_reply_id;
    
    IF v_target_user_id IS NOT NULL AND v_target_user_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, entity_id)
      VALUES (v_target_user_id, NEW.user_id, 'river_reply_reply', NEW.id);
    END IF;
  ELSE
    -- Top-level reply: notify entry author
    SELECT user_id INTO v_target_user_id
    FROM xcrol_entries WHERE id = NEW.entry_id;
    
    IF v_target_user_id IS NOT NULL AND v_target_user_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, entity_id)
      VALUES (v_target_user_id, NEW.user_id, 'river_reply', NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_river_reply
  AFTER INSERT ON public.river_replies
  FOR EACH ROW EXECUTE FUNCTION public.notify_river_reply();

-- 2. Brook post: notify the other participant
CREATE OR REPLACE FUNCTION public.notify_brook_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user1 uuid;
  v_user2 uuid;
  v_target uuid;
BEGIN
  SELECT user1_id, user2_id INTO v_user1, v_user2
  FROM brooks WHERE id = NEW.brook_id;
  
  IF NEW.user_id = v_user1 THEN v_target := v_user2;
  ELSE v_target := v_user1;
  END IF;
  
  IF v_target IS NOT NULL AND v_target != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (v_target, NEW.user_id, 'brook_post', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_brook_post
  AFTER INSERT ON public.brook_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_brook_post();

-- 3. Brook comment: notify post author
CREATE OR REPLACE FUNCTION public.notify_brook_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_post_author uuid;
BEGIN
  SELECT user_id INTO v_post_author
  FROM brook_posts WHERE id = NEW.post_id;
  
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (v_post_author, NEW.user_id, 'brook_comment', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_brook_comment
  AFTER INSERT ON public.brook_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_brook_comment();

-- 4. Brook reaction: notify post author
CREATE OR REPLACE FUNCTION public.notify_brook_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_post_author uuid;
BEGIN
  SELECT user_id INTO v_post_author
  FROM brook_posts WHERE id = NEW.post_id;
  
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (v_post_author, NEW.user_id, 'brook_reaction', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_brook_reaction
  AFTER INSERT ON public.brook_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_brook_reaction();

-- 5. Hosting request: notify host
CREATE OR REPLACE FUNCTION public.notify_hosting_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.to_user_id != NEW.from_user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.to_user_id, NEW.from_user_id, 'hosting_request', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_hosting_request
  AFTER INSERT ON public.hosting_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_hosting_request();

-- 6. Meetup request: notify recipient
CREATE OR REPLACE FUNCTION public.notify_meetup_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.to_user_id != NEW.from_user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (NEW.to_user_id, NEW.from_user_id, 'meetup_request', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_meetup_request
  AFTER INSERT ON public.meetup_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_meetup_request();

-- 7. Group post comment: notify post author
CREATE OR REPLACE FUNCTION public.notify_group_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_post_author uuid;
BEGIN
  SELECT user_id INTO v_post_author
  FROM group_posts WHERE id = NEW.post_id;
  
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (v_post_author, NEW.user_id, 'group_comment', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_group_comment
  AFTER INSERT ON public.group_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_group_comment();

-- 8. Group post reaction: notify post author
CREATE OR REPLACE FUNCTION public.notify_group_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_post_author uuid;
BEGIN
  SELECT user_id INTO v_post_author
  FROM group_posts WHERE id = NEW.post_id;
  
  IF v_post_author IS NOT NULL AND v_post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (v_post_author, NEW.user_id, 'group_reaction', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_group_reaction
  AFTER INSERT ON public.group_post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_group_reaction();

-- 9. Group comment reaction: notify comment author
CREATE OR REPLACE FUNCTION public.notify_group_comment_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_comment_author uuid;
BEGIN
  SELECT user_id INTO v_comment_author
  FROM group_post_comments WHERE id = NEW.comment_id;
  
  IF v_comment_author IS NOT NULL AND v_comment_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, entity_id)
    VALUES (v_comment_author, NEW.user_id, 'group_comment_reaction', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_group_comment_reaction
  AFTER INSERT ON public.group_comment_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_group_comment_reaction();
