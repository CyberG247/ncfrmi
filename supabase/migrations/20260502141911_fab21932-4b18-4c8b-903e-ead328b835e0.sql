-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles selectable by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'officer', 'applicant');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Applications
CREATE TYPE public.application_type AS ENUM ('asylum', 'refugee', 'idp', 'returnee');
CREATE TYPE public.application_status AS ENUM (
  'submitted','under_review','documents_required','interview_scheduled','approved','rejected','closed'
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE DEFAULT ('NCF-' || to_char(now(), 'YY') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  type public.application_type NOT NULL,
  status public.application_status NOT NULL DEFAULT 'submitted',
  full_name TEXT NOT NULL,
  phone TEXT,
  state TEXT,
  lga TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own applications" ON public.applications FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners create applications" ON public.applications FOR INSERT
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own draft" ON public.applications FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Events (timeline)
CREATE TABLE public.application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  from_status public.application_status,
  to_status public.application_status,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own application events" ON public.application_events FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id
    AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Officers/admins add events" ON public.application_events FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'officer') OR public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_apps_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- New user trigger: create profile + applicant role
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'applicant');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Status change trigger -> event + notification
CREATE OR REPLACE FUNCTION public.handle_status_change() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_events (application_id, actor_id, event_type, to_status, note)
    VALUES (NEW.id, NEW.user_id, 'created', NEW.status, 'Application submitted');
    INSERT INTO public.notifications (user_id, application_id, title, body)
    VALUES (NEW.user_id, NEW.id, 'Application submitted', 'Your ' || NEW.reference || ' has been received.');
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_events (application_id, actor_id, event_type, from_status, to_status)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
    INSERT INTO public.notifications (user_id, application_id, title, body)
    VALUES (NEW.user_id, NEW.id, 'Status updated: ' || NEW.status::text,
            'Your application ' || NEW.reference || ' is now ' || replace(NEW.status::text,'_',' ') || '.');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_app_status AFTER INSERT OR UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.handle_status_change();

-- Realtime
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.application_events REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.application_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;