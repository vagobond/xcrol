-- 1. Lock down search_path on the one trigger function missing it
ALTER FUNCTION public.scroll_publications_lock_snapshot() SET search_path = public;

-- 2. Revoke EXECUTE from anon + authenticated on all internal trigger functions.
--    Trigger functions are only invoked by the database engine on row events;
--    nobody should be able to call them as RPC.
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND pg_get_function_result(p.oid) = 'trigger'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', f.sig);
  END LOOP;
END
$$;