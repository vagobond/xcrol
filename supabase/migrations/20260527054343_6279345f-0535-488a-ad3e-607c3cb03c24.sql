
-- New RPC: create an OAuth app and return the plaintext secret exactly once
CREATE OR REPLACE FUNCTION public.create_oauth_app(
  p_name text,
  p_description text,
  p_homepage_url text,
  p_redirect_uris text[],
  p_logo_url text
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  client_id text,
  redirect_uris text[],
  logo_url text,
  homepage_url text,
  is_verified boolean,
  created_at timestamptz,
  plain_secret text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_secret text;
  v_row public.oauth_clients%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_secret := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.oauth_clients (
    name, description, homepage_url, redirect_uris, logo_url, owner_id, client_secret_hash
  ) VALUES (
    p_name, p_description, p_homepage_url, p_redirect_uris, p_logo_url, auth.uid(),
    crypt(v_secret, gen_salt('bf'))
  )
  RETURNING * INTO v_row;

  RETURN QUERY SELECT
    v_row.id, v_row.name, v_row.description, v_row.client_id,
    v_row.redirect_uris, v_row.logo_url, v_row.homepage_url,
    v_row.is_verified, v_row.created_at, v_secret;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_oauth_app(text, text, text, text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_oauth_app(text, text, text, text[], text) TO authenticated;

-- Drop legacy trigger and plaintext column
DROP TRIGGER IF EXISTS hash_client_secret_trigger ON public.oauth_clients;
ALTER TABLE public.oauth_clients DROP COLUMN IF EXISTS client_secret;
DROP FUNCTION IF EXISTS public.hash_oauth_client_secret();
