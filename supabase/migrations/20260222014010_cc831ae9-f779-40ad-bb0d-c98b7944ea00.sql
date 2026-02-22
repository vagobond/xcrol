
-- Create a function to verify OAuth client secrets using pgcrypto crypt
CREATE OR REPLACE FUNCTION public.verify_oauth_client_secret(p_client_id uuid, p_secret text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT client_secret_hash INTO stored_hash
  FROM public.oauth_clients
  WHERE id = p_client_id;

  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN crypt(p_secret, stored_hash) = stored_hash;
END;
$$;
