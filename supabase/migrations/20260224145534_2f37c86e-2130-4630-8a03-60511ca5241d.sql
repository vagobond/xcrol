CREATE OR REPLACE FUNCTION public.verify_oauth_client_secret(p_client_id uuid, p_secret text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.hash_oauth_client_secret()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.client_secret IS NOT NULL AND NEW.client_secret != '' THEN
    NEW.client_secret_hash := crypt(NEW.client_secret, gen_salt('bf'));
    NEW.client_secret := '';
  END IF;
  RETURN NEW;
END;
$function$;