-- Create incidents table
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  category text NOT NULL,
  severity text NOT NULL,
  location text NOT NULL,
  incident_date timestamptz NOT NULL DEFAULT now(),
  description text NOT NULL,
  action_taken text,
  photo_base64 text,
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX incidents_reference_idx ON public.incidents(reference);
CREATE INDEX incidents_category_idx ON public.incidents(category);
CREATE INDEX incidents_severity_idx ON public.incidents(severity);
CREATE INDEX incidents_created_at_idx ON public.incidents(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view incidents"
  ON public.incidents FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users insert incidents"
  ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update incidents"
  ON public.incidents FOR UPDATE TO authenticated
  USING (true);

CREATE TRIGGER incidents_set_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add real-time publication support
ALTER TABLE public.incidents REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
