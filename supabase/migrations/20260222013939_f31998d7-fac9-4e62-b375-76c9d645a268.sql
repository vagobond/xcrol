
-- Fix 1: Revoke direct email column access on profiles for authenticated role
REVOKE SELECT (email) ON public.profiles FROM authenticated;

-- Fix 2: Hash OAuth client secrets
-- Add client_secret_hash column
ALTER TABLE public.oauth_clients ADD COLUMN IF NOT EXISTS client_secret_hash text;

-- Hash existing plain-text secrets using pgcrypto crypt+bf
UPDATE public.oauth_clients
SET client_secret_hash = crypt(client_secret, gen_salt('bf'))
WHERE client_secret IS NOT NULL AND client_secret != '';

-- Clear plain-text secrets
UPDATE public.oauth_clients SET client_secret = '';

-- Create a trigger function that hashes secrets on insert/update
CREATE OR REPLACE FUNCTION public.hash_oauth_client_secret()
RETURNS TRIGGER AS $$
BEGIN
  -- Only hash if client_secret is being set to a non-empty value
  IF NEW.client_secret IS NOT NULL AND NEW.client_secret != '' THEN
    NEW.client_secret_hash := crypt(NEW.client_secret, gen_salt('bf'));
    -- Clear the plain-text field after hashing
    NEW.client_secret := '';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER hash_client_secret_trigger
BEFORE INSERT OR UPDATE OF client_secret ON public.oauth_clients
FOR EACH ROW
EXECUTE FUNCTION public.hash_oauth_client_secret();
