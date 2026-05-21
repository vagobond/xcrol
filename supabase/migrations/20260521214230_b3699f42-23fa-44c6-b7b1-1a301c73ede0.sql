
CREATE TABLE public.scrolls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Scroll',
  subtitle TEXT,
  blurb TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_scrolls_user_id ON public.scrolls(user_id);

ALTER TABLE public.scrolls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their scrolls" ON public.scrolls
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owners can create their scrolls" ON public.scrolls
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their scrolls" ON public.scrolls
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete their scrolls" ON public.scrolls
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_scrolls_updated_at
  BEFORE UPDATE ON public.scrolls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.scroll_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scroll_id UUID NOT NULL REFERENCES public.scrolls(id) ON DELETE CASCADE,
  item_position INTEGER NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL CHECK (item_type IN ('xcrol','group_post','interlude')),
  source_id UUID,
  custom_title TEXT,
  custom_body TEXT,
  chapter_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_scroll_items_scroll_id ON public.scroll_items(scroll_id, item_position);
CREATE UNIQUE INDEX idx_scroll_items_unique_source
  ON public.scroll_items(scroll_id, item_type, source_id)
  WHERE source_id IS NOT NULL;

ALTER TABLE public.scroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view scroll items" ON public.scroll_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.scrolls s WHERE s.id = scroll_items.scroll_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Owners can create scroll items" ON public.scroll_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.scrolls s WHERE s.id = scroll_items.scroll_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Owners can update scroll items" ON public.scroll_items
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.scrolls s WHERE s.id = scroll_items.scroll_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Owners can delete scroll items" ON public.scroll_items
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.scrolls s WHERE s.id = scroll_items.scroll_id AND s.user_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.compile_scroll_draft(
  p_scroll_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_include_xcrol BOOLEAN DEFAULT TRUE,
  p_include_groups BOOLEAN DEFAULT TRUE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_next_pos INTEGER;
  v_inserted INTEGER := 0;
BEGIN
  SELECT user_id INTO v_owner FROM public.scrolls WHERE id = p_scroll_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT COALESCE(MAX(item_position), -1) + 1 INTO v_next_pos
  FROM public.scroll_items WHERE scroll_id = p_scroll_id;

  IF p_include_xcrol THEN
    WITH new_items AS (
      SELECT x.id, x.entry_date,
             ROW_NUMBER() OVER (ORDER BY x.entry_date ASC, x.created_at ASC) - 1 AS rn
      FROM public.xcrol_entries x
      WHERE x.user_id = v_owner
        AND x.entry_date >= p_start_date
        AND x.entry_date <= p_end_date
        AND NOT EXISTS (
          SELECT 1 FROM public.scroll_items si
          WHERE si.scroll_id = p_scroll_id
            AND si.item_type = 'xcrol' AND si.source_id = x.id
        )
    )
    INSERT INTO public.scroll_items (scroll_id, item_position, item_type, source_id, chapter_label)
    SELECT p_scroll_id, v_next_pos + rn, 'xcrol', id, to_char(entry_date, 'Mon YYYY')
    FROM new_items;
    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    v_next_pos := v_next_pos + v_inserted;
  END IF;

  IF p_include_groups THEN
    WITH new_items AS (
      SELECT gp.id, gp.created_at AS posted_at,
             ROW_NUMBER() OVER (ORDER BY gp.created_at ASC) - 1 AS rn
      FROM public.group_posts gp
      WHERE gp.user_id = v_owner
        AND gp.created_at::date >= p_start_date
        AND gp.created_at::date <= p_end_date
        AND NOT EXISTS (
          SELECT 1 FROM public.scroll_items si
          WHERE si.scroll_id = p_scroll_id
            AND si.item_type = 'group_post' AND si.source_id = gp.id
        )
    )
    INSERT INTO public.scroll_items (scroll_id, item_position, item_type, source_id, chapter_label)
    SELECT p_scroll_id, v_next_pos + rn, 'group_post', id, to_char(posted_at, 'Mon YYYY')
    FROM new_items;
  END IF;

  RETURN (SELECT COUNT(*)::int FROM public.scroll_items WHERE scroll_id = p_scroll_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_scroll_contents(p_scroll_id UUID)
RETURNS TABLE (
  item_id UUID,
  item_position INTEGER,
  item_type TEXT,
  source_id UUID,
  chapter_label TEXT,
  custom_title TEXT,
  custom_body TEXT,
  content TEXT,
  link TEXT,
  item_date TIMESTAMP WITH TIME ZONE,
  group_name TEXT,
  privacy_level TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT user_id INTO v_owner FROM public.scrolls WHERE id = p_scroll_id;
  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  RETURN QUERY
  SELECT
    si.id AS item_id,
    si.item_position,
    si.item_type,
    si.source_id,
    si.chapter_label,
    si.custom_title,
    si.custom_body,
    CASE
      WHEN si.item_type = 'interlude' THEN si.custom_body
      WHEN si.item_type = 'xcrol' THEN x.content
      WHEN si.item_type = 'group_post' THEN gp.content
    END AS content,
    CASE
      WHEN si.item_type = 'xcrol' THEN x.link
      WHEN si.item_type = 'group_post' THEN gp.link
    END AS link,
    CASE
      WHEN si.item_type = 'xcrol' THEN x.created_at
      WHEN si.item_type = 'group_post' THEN gp.created_at
    END AS item_date,
    g.name AS group_name,
    x.privacy_level
  FROM public.scroll_items si
  LEFT JOIN public.xcrol_entries x
    ON si.item_type = 'xcrol' AND x.id = si.source_id AND x.user_id = v_owner
  LEFT JOIN public.group_posts gp
    ON si.item_type = 'group_post' AND gp.id = si.source_id AND gp.user_id = v_owner
  LEFT JOIN public.groups g ON g.id = gp.group_id
  WHERE si.scroll_id = p_scroll_id
    AND (
      si.item_type = 'interlude'
      OR (si.item_type = 'xcrol' AND x.id IS NOT NULL)
      OR (si.item_type = 'group_post' AND gp.id IS NOT NULL)
    )
  ORDER BY si.item_position ASC;
END;
$$;
