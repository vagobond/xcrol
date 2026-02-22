ALTER TABLE public.profiles ADD COLUMN nostr_handle text;

-- Grant select on nostr_handle to authenticated and anon (it's public discovery data)
-- nostr_handle is already accessible since it's a new nullable column