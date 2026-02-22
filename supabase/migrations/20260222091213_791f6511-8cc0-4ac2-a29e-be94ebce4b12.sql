
ALTER TABLE public.profiles ADD COLUMN nostr_npub text;

-- Grant SELECT on this column to authenticated/anon (it's public-safe like username)
-- The column-level grants are already in place for other columns, so we add this one
GRANT SELECT (nostr_npub) ON public.profiles TO authenticated;
GRANT SELECT (nostr_npub) ON public.profiles TO anon;
