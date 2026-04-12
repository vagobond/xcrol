
-- 1. Update get_public_hometowns to round coordinates to ~10km precision
CREATE OR REPLACE FUNCTION public.get_public_hometowns()
 RETURNS TABLE(id uuid, display_name text, avatar_url text, hometown_city text, hometown_country text, hometown_latitude double precision, hometown_longitude double precision, hometown_description text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.hometown_city,
    p.hometown_country,
    ROUND(p.hometown_latitude::numeric, 1)::double precision AS hometown_latitude,
    ROUND(p.hometown_longitude::numeric, 1)::double precision AS hometown_longitude,
    p.hometown_description
  FROM public.profiles p
  WHERE p.hometown_city IS NOT NULL
    AND (
      auth.uid() IS NULL 
      OR auth.uid() = p.id 
      OR (
        NOT is_blocked(p.id, auth.uid()) 
        AND NOT is_blocked(auth.uid(), p.id)
      )
    );
$function$;

-- 2. Pending invite codes table for cross-browser email confirmation
CREATE TABLE public.pending_invite_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  invite_code text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pending codes"
  ON public.pending_invite_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending codes"
  ON public.pending_invite_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending codes"
  ON public.pending_invite_codes FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Dismissed reference notifications table
CREATE TABLE public.dismissed_reference_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reference_id uuid NOT NULL REFERENCES public.user_references(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, reference_id)
);

ALTER TABLE public.dismissed_reference_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissals"
  ON public.dismissed_reference_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dismissals"
  ON public.dismissed_reference_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own dismissals"
  ON public.dismissed_reference_notifications FOR DELETE
  USING (auth.uid() = user_id);
