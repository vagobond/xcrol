
-- ============ Tables ============
CREATE TABLE public.scroll_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scroll_id uuid NOT NULL REFERENCES public.scrolls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  blurb text,
  cover_image_url text,
  content_json jsonb NOT NULL,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','unlisted')),
  published_at timestamptz NOT NULL DEFAULT now(),
  unpublished_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scroll_publications_user ON public.scroll_publications(user_id);
CREATE INDEX idx_scroll_publications_scroll ON public.scroll_publications(scroll_id);
CREATE INDEX idx_scroll_publications_published_at ON public.scroll_publications(published_at DESC);
CREATE INDEX idx_scroll_publications_public ON public.scroll_publications(published_at DESC)
  WHERE visibility = 'public' AND unpublished_at IS NULL;

CREATE TABLE public.scroll_publication_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id uuid NOT NULL REFERENCES public.scroll_publications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('✨','📜','🔥','💛','🌊','🏰')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, user_id, emoji)
);
CREATE INDEX idx_scroll_publication_reactions_pub ON public.scroll_publication_reactions(publication_id);

-- ============ updated_at trigger ============
CREATE TRIGGER update_scroll_publications_updated_at
BEFORE UPDATE ON public.scroll_publications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Immutability trigger ============
CREATE OR REPLACE FUNCTION public.scroll_publications_lock_snapshot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.subtitle IS DISTINCT FROM OLD.subtitle
     OR NEW.blurb IS DISTINCT FROM OLD.blurb
     OR NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url
     OR NEW.content_json IS DISTINCT FROM OLD.content_json
     OR NEW.slug IS DISTINCT FROM OLD.slug
     OR NEW.scroll_id IS DISTINCT FROM OLD.scroll_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.published_at IS DISTINCT FROM OLD.published_at
  THEN
    RAISE EXCEPTION 'Publication snapshot fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER scroll_publications_lock_snapshot_trg
BEFORE UPDATE ON public.scroll_publications
FOR EACH ROW EXECUTE FUNCTION public.scroll_publications_lock_snapshot();

-- ============ RLS ============
ALTER TABLE public.scroll_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scroll_publication_reactions ENABLE ROW LEVEL SECURITY;

-- SELECT: public+live readable by anyone; owner sees own always; unlisted accessible if caller knows the slug (we still allow SELECT to anon, the slug is the access token)
CREATE POLICY "Public publications viewable by anyone"
ON public.scroll_publications FOR SELECT
USING (
  (visibility = 'public' AND unpublished_at IS NULL)
  OR (visibility = 'unlisted' AND unpublished_at IS NULL)
  OR (auth.uid() = user_id)
);

CREATE POLICY "Owners can insert their publications"
ON public.scroll_publications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update their publications"
ON public.scroll_publications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Owners can delete their publications"
ON public.scroll_publications FOR DELETE
USING (auth.uid() = user_id);

-- Reactions: counts visible to all; users manage their own
CREATE POLICY "Reactions viewable by anyone"
ON public.scroll_publication_reactions FOR SELECT
USING (true);

CREATE POLICY "Users add their own reactions"
ON public.scroll_publication_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users remove their own reactions"
ON public.scroll_publication_reactions FOR DELETE
USING (auth.uid() = user_id);

-- ============ RPCs ============
CREATE OR REPLACE FUNCTION public.publish_scroll(p_scroll_id uuid, p_visibility text DEFAULT 'public')
RETURNS public.scroll_publications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scroll public.scrolls;
  v_content jsonb;
  v_slug text;
  v_base text;
  v_pub public.scroll_publications;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_visibility NOT IN ('public','unlisted') THEN
    RAISE EXCEPTION 'Invalid visibility';
  END IF;

  SELECT * INTO v_scroll FROM public.scrolls WHERE id = p_scroll_id;
  IF v_scroll.id IS NULL OR v_scroll.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Scroll not found or not owner';
  END IF;

  -- Snapshot contents
  SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY c.item_position), '[]'::jsonb)
    INTO v_content
  FROM public.get_scroll_contents(p_scroll_id) c;

  -- Slug: slugified title + 6-hex hash
  v_base := lower(regexp_replace(coalesce(v_scroll.title, 'scroll'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);
  IF length(v_base) = 0 THEN v_base := 'scroll'; END IF;
  IF length(v_base) > 60 THEN v_base := substring(v_base from 1 for 60); END IF;
  v_slug := v_base || '-' || substring(encode(gen_random_bytes(4),'hex') from 1 for 6);

  INSERT INTO public.scroll_publications
    (scroll_id, user_id, slug, title, subtitle, blurb, cover_image_url, content_json, visibility)
  VALUES
    (v_scroll.id, v_scroll.user_id, v_slug, v_scroll.title, v_scroll.subtitle, v_scroll.blurb,
     v_scroll.cover_image_url, v_content, p_visibility)
  RETURNING * INTO v_pub;

  RETURN v_pub;
END;
$$;

CREATE OR REPLACE FUNCTION public.unpublish_publication(p_publication_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.scroll_publications
    SET unpublished_at = now()
  WHERE id = p_publication_id AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_publication_view(p_publication_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.scroll_publications
    SET view_count = view_count + 1
  WHERE id = p_publication_id
    AND unpublished_at IS NULL;
END;
$$;
