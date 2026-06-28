CREATE POLICY "Public can read scroll_items for public publications"
ON public.scroll_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.scroll_publications p
    WHERE p.scroll_id = scroll_items.scroll_id
      AND p.visibility = 'public'
      AND p.published_at IS NOT NULL
      AND p.unpublished_at IS NULL
  )
);