-- Drop the restrictive officer/admin-only policies
DROP POLICY IF EXISTS "Officers and admins view registrants" ON public.registrants;
DROP POLICY IF EXISTS "Officers and admins insert registrants" ON public.registrants;
DROP POLICY IF EXISTS "Officers and admins update registrants" ON public.registrants;

-- Create new policies that allow any authenticated user (including applicants and officers) to manage registrants
CREATE POLICY "Authenticated users view registrants"
  ON public.registrants FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users insert registrants"
  ON public.registrants FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update registrants"
  ON public.registrants FOR UPDATE TO authenticated
  USING (true);
