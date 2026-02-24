

## Fix: Login with Xcrol Broken for All OAuth Clients

### What Happened

The two database functions that handle client secret verification (`verify_oauth_client_secret` and `hash_oauth_client_secret`) were recreated at some point with `SET search_path TO 'public'`. This is normally good security practice, but these functions call `crypt()` and `gen_salt()` from pgcrypto, which is installed in the `extensions` schema -- not `public`. So the functions can no longer find `crypt()`.

### Impact

All "Login with Xcrol" OAuth flows are broken for every registered app. The authorize step succeeds (no pgcrypto needed), but the token exchange step always fails with a 401 because secret verification throws an error internally.

### Fix (database migration only, no code changes)

Update the search_path on both functions to include `extensions`:

```sql
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
```

### What This Does NOT Require

- No code changes
- No edge function changes
- No re-setting of client secrets (all existing hashes are valid bcrypt)
- No new extensions to install (pgcrypto is already enabled)

### Risk

None. This only changes the schema search path so the functions can locate `crypt()` and `gen_salt()`. All existing data and behavior remain identical.

