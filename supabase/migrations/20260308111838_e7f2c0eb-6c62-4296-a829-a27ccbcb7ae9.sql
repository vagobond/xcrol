
-- Create audit_log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid,
  target_id uuid,
  target_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by event type and time
CREATE INDEX idx_audit_log_event_type ON public.audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);

-- Enable RLS - only admins can read
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow inserts from triggers (SECURITY DEFINER functions)
-- No INSERT policy needed since triggers use SECURITY DEFINER

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- 1. User signup (profile creation)
CREATE OR REPLACE FUNCTION public.audit_user_signup()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('user_signup', NEW.id, NEW.id, 'user', jsonb_build_object(
    'display_name', NEW.display_name,
    'username', NEW.username,
    'email', NEW.email
  ));
  RETURN NEW;
END;
$$;

-- 2. Group creation
CREATE OR REPLACE FUNCTION public.audit_group_created()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('group_created', NEW.creator_id, NEW.id, 'group', jsonb_build_object(
    'name', NEW.name,
    'slug', NEW.slug
  ));
  RETURN NEW;
END;
$$;

-- 3. Group deletion
CREATE OR REPLACE FUNCTION public.audit_group_deleted()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('group_deleted', OLD.creator_id, OLD.id, 'group', jsonb_build_object(
    'name', OLD.name,
    'slug', OLD.slug
  ));
  RETURN OLD;
END;
$$;

-- 4. Friendship created
CREATE OR REPLACE FUNCTION public.audit_friendship_created()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('friendship_created', NEW.user_id, NEW.friend_id, 'friendship', jsonb_build_object(
    'level', NEW.level::text
  ));
  RETURN NEW;
END;
$$;

-- 5. Friendship removed
CREATE OR REPLACE FUNCTION public.audit_friendship_removed()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('friendship_removed', OLD.user_id, OLD.friend_id, 'friendship', jsonb_build_object(
    'level', OLD.level::text
  ));
  RETURN OLD;
END;
$$;

-- 6. Group member joined
CREATE OR REPLACE FUNCTION public.audit_group_member_joined()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'active' THEN
    INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
    VALUES ('group_member_joined', NEW.user_id, NEW.group_id, 'group', jsonb_build_object(
      'role', NEW.role
    ));
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Group member left/removed
CREATE OR REPLACE FUNCTION public.audit_group_member_left()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('group_member_left', OLD.user_id, OLD.group_id, 'group', jsonb_build_object(
    'role', OLD.role
  ));
  RETURN OLD;
END;
$$;

-- 8. Xcrol entry posted
CREATE OR REPLACE FUNCTION public.audit_xcrol_entry()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('xcrol_entry_posted', NEW.user_id, NEW.id, 'xcrol_entry', jsonb_build_object(
    'privacy_level', NEW.privacy_level
  ));
  RETURN NEW;
END;
$$;

-- 9. Group post created
CREATE OR REPLACE FUNCTION public.audit_group_post()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('group_post_created', NEW.user_id, NEW.id, 'group_post', jsonb_build_object(
    'group_id', NEW.group_id
  ));
  RETURN NEW;
END;
$$;

-- 10. Role change
CREATE OR REPLACE FUNCTION public.audit_role_change()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
    VALUES ('role_granted', auth.uid(), NEW.user_id, 'role', jsonb_build_object(
      'role', NEW.role::text
    ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
    VALUES ('role_revoked', auth.uid(), OLD.user_id, 'role', jsonb_build_object(
      'role', OLD.role::text
    ));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- 11. Deletion request processing
CREATE OR REPLACE FUNCTION public.audit_deletion_request()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
    VALUES ('deletion_request_' || NEW.status, auth.uid(), NEW.user_id, 'user', jsonb_build_object(
      'reason', NEW.reason,
      'admin_notes', NEW.admin_notes
    ));
  END IF;
  RETURN NEW;
END;
$$;

-- 12. Town listing created
CREATE OR REPLACE FUNCTION public.audit_town_listing()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('town_listing_created', NEW.user_id, NEW.id, 'town_listing', jsonb_build_object(
    'title', NEW.title,
    'category', NEW.category
  ));
  RETURN NEW;
END;
$$;

-- 13. Brook created
CREATE OR REPLACE FUNCTION public.audit_brook_created()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('brook_created', NEW.user1_id, NEW.id, 'brook', jsonb_build_object(
    'user2_id', NEW.user2_id::text
  ));
  RETURN NEW;
END;
$$;

-- 14. Invite sent
CREATE OR REPLACE FUNCTION public.audit_invite_sent()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('invite_sent', NEW.inviter_id, NEW.id, 'invite', jsonb_build_object(
    'invitee_email', NEW.invitee_email
  ));
  RETURN NEW;
END;
$$;

-- 15. Reference created
CREATE OR REPLACE FUNCTION public.audit_reference_created()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.audit_log (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('reference_created', NEW.from_user_id, NEW.to_user_id, 'reference', jsonb_build_object(
    'reference_type', NEW.reference_type::text,
    'rating', NEW.rating
  ));
  RETURN NEW;
END;
$$;

-- ============================================
-- ATTACH TRIGGERS
-- ============================================

CREATE TRIGGER audit_on_profile_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_user_signup();

CREATE TRIGGER audit_on_group_insert
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.audit_group_created();

CREATE TRIGGER audit_on_group_delete
  AFTER DELETE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.audit_group_deleted();

CREATE TRIGGER audit_on_friendship_insert
  AFTER INSERT ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.audit_friendship_created();

CREATE TRIGGER audit_on_friendship_delete
  AFTER DELETE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.audit_friendship_removed();

CREATE TRIGGER audit_on_group_member_insert
  AFTER INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_group_member_joined();

CREATE TRIGGER audit_on_group_member_delete
  AFTER DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_group_member_left();

CREATE TRIGGER audit_on_xcrol_entry_insert
  AFTER INSERT ON public.xcrol_entries
  FOR EACH ROW EXECUTE FUNCTION public.audit_xcrol_entry();

CREATE TRIGGER audit_on_group_post_insert
  AFTER INSERT ON public.group_posts
  FOR EACH ROW EXECUTE FUNCTION public.audit_group_post();

CREATE TRIGGER audit_on_role_insert
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_change();

CREATE TRIGGER audit_on_role_delete
  AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_role_change();

CREATE TRIGGER audit_on_deletion_request_update
  AFTER UPDATE ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_deletion_request();

CREATE TRIGGER audit_on_town_listing_insert
  AFTER INSERT ON public.town_listings
  FOR EACH ROW EXECUTE FUNCTION public.audit_town_listing();

CREATE TRIGGER audit_on_brook_insert
  AFTER INSERT ON public.brooks
  FOR EACH ROW EXECUTE FUNCTION public.audit_brook_created();

CREATE TRIGGER audit_on_invite_insert
  AFTER INSERT ON public.user_invites
  FOR EACH ROW EXECUTE FUNCTION public.audit_invite_sent();

CREATE TRIGGER audit_on_reference_insert
  AFTER INSERT ON public.user_references
  FOR EACH ROW EXECUTE FUNCTION public.audit_reference_created();
