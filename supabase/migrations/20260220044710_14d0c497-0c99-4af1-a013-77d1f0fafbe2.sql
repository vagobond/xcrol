-- Drop the overly permissive policy that exposes invitee_email to everyone
DROP POLICY IF EXISTS "Anyone can check invite codes" ON public.user_invites;