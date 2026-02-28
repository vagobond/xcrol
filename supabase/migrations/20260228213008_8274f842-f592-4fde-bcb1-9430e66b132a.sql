
CREATE OR REPLACE FUNCTION public.get_message_profiles(p_user_ids uuid[])
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  link text,
  linkedin_url text,
  instagram_url text,
  whatsapp text,
  contact_email text,
  phone_number text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.link,
    p.linkedin_url,
    p.instagram_url,
    p.whatsapp,
    p.contact_email,
    p.phone_number
  FROM public.profiles p
  WHERE p.id = ANY(p_user_ids);
END;
$$;
