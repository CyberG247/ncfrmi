-- Add unique constraint to the phone column in the registrants table
ALTER TABLE public.registrants ADD CONSTRAINT registrants_phone_unique UNIQUE (phone);

-- Enable Realtime for registrants table
ALTER TABLE public.registrants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registrants;

-- Drop existings to avoid duplicate policy error if they exist
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;

-- Allow admins to perform all actions on profiles
CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
