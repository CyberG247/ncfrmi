
CREATE TYPE public.registrant_category AS ENUM ('idp','refugee','migrant','returnee');

CREATE TABLE public.registrants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  category public.registrant_category NOT NULL,
  full_name text NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  dob date NOT NULL,
  gender text NOT NULL,
  nationality text NOT NULL DEFAULT 'Nigeria',
  state_origin text NOT NULL,
  lga text NOT NULL,
  dependants integer NOT NULL DEFAULT 0,
  circumstances text NOT NULL,
  face_captured boolean NOT NULL DEFAULT false,
  thumb_captured boolean NOT NULL DEFAULT false,
  captured_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX registrants_category_idx ON public.registrants(category);
CREATE INDEX registrants_created_at_idx ON public.registrants(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrants TO authenticated;
GRANT ALL ON public.registrants TO service_role;

ALTER TABLE public.registrants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers and admins view registrants"
  ON public.registrants FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Officers and admins insert registrants"
  ON public.registrants FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Officers and admins update registrants"
  ON public.registrants FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'officer') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins delete registrants"
  ON public.registrants FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER registrants_set_updated_at
  BEFORE UPDATE ON public.registrants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
