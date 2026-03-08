
CREATE POLICY "Admins can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
