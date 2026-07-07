-- Create interventions table
CREATE TABLE public.interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp text NOT NULL,
  category text NOT NULL,
  details text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  captured_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX interventions_category_idx ON public.interventions(category);
CREATE INDEX interventions_created_at_idx ON public.interventions(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interventions TO authenticated;
GRANT ALL ON public.interventions TO service_role;

ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users view interventions"
  ON public.interventions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users insert interventions"
  ON public.interventions FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update interventions"
  ON public.interventions FOR UPDATE TO authenticated
  USING (true);

CREATE TRIGGER interventions_set_updated_at
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create news table
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL DEFAULT to_char(now(), 'Mon DD, YYYY'),
  tag text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX news_created_at_idx ON public.news(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT SELECT ON public.news TO anon;
GRANT ALL ON public.news TO service_role;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users view news"
  ON public.news FOR SELECT TO anon
  USING (true);

CREATE POLICY "Authenticated users view news"
  ON public.news FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users insert news"
  ON public.news FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users update news"
  ON public.news FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users delete news"
  ON public.news FOR DELETE TO authenticated
  USING (true);

CREATE TRIGGER news_set_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add real-time publication support
ALTER TABLE public.interventions REPLICA IDENTITY FULL;
ALTER TABLE public.news REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interventions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;
