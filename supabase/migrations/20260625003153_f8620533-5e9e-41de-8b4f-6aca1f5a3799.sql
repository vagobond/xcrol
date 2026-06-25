GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_xcrol_entry(uuid, text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_river_entries(uuid, integer, integer, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_river_replies(uuid[], uuid) TO anon, authenticated;