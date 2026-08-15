
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE public.app_role AS ENUM ('admin', 'gestionnaire', 'enseignant');

CREATE OR REPLACE FUNCTION public.time_to_min(t time)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT EXTRACT(EPOCH FROM t) / 60
$$;

-- schools
CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'lycee',
  days_of_week text[] NOT NULL DEFAULT ARRAY['lundi','mardi','mercredi','jeudi','vendredi'],
  day_start_time time NOT NULL DEFAULT '08:00',
  day_end_time time NOT NULL DEFAULT '17:00',
  slot_duration_minutes int NOT NULL DEFAULT 60,
  break_start_time time,
  break_end_time time,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT SELECT ON public.schools TO anon;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.can_manage()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'gestionnaire')
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "profiles_select_own_or_school" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR (school_id IS NOT NULL AND school_id = public.current_school_id()));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_self" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "schools_select_own" ON public.schools FOR SELECT TO authenticated
  USING (id = public.current_school_id());
CREATE POLICY "schools_insert_any_auth" ON public.schools FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "schools_update_admin" ON public.schools FOR UPDATE TO authenticated
  USING (id = public.current_school_id() AND public.can_manage())
  WITH CHECK (id = public.current_school_id() AND public.can_manage());

-- teachers
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  max_hours_week int NOT NULL DEFAULT 20,
  latest_end_time time,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teachers TO authenticated;
GRANT SELECT ON public.teachers TO anon;
GRANT ALL ON public.teachers TO service_role;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  requires_special_room boolean NOT NULL DEFAULT false,
  required_room_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT SELECT ON public.subjects TO anon;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teacher_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  UNIQUE (teacher_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_subjects TO authenticated;
GRANT ALL ON public.teacher_subjects TO service_role;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teacher_unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_unavailabilities TO authenticated;
GRANT ALL ON public.teacher_unavailabilities TO service_role;
ALTER TABLE public.teacher_unavailabilities ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  level text,
  headcount int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT ON public.classes TO anon;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity int NOT NULL DEFAULT 30,
  room_type text NOT NULL DEFAULT 'normale',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT SELECT ON public.rooms TO anon;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  hours_per_week int NOT NULL DEFAULT 1,
  UNIQUE (class_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_subjects TO authenticated;
GRANT ALL ON public.class_subjects TO service_role;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.timetable_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Version',
  status text NOT NULL DEFAULT 'brouillon',
  is_public boolean NOT NULL DEFAULT false,
  public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX timetable_versions_public_token_idx ON public.timetable_versions(public_token);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_versions TO authenticated;
GRANT SELECT ON public.timetable_versions TO anon;
GRANT ALL ON public.timetable_versions TO service_role;
ALTER TABLE public.timetable_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  timetable_version_id uuid NOT NULL REFERENCES public.timetable_versions(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  CONSTRAINT timetable_entries_teacher_no_overlap EXCLUDE USING gist (
    timetable_version_id WITH =, teacher_id WITH =, day_of_week WITH =,
    numrange(public.time_to_min(start_time), public.time_to_min(end_time)) WITH &&
  ) WHERE (teacher_id IS NOT NULL),
  CONSTRAINT timetable_entries_class_no_overlap EXCLUDE USING gist (
    timetable_version_id WITH =, class_id WITH =, day_of_week WITH =,
    numrange(public.time_to_min(start_time), public.time_to_min(end_time)) WITH &&
  ),
  CONSTRAINT timetable_entries_room_no_overlap EXCLUDE USING gist (
    timetable_version_id WITH =, room_id WITH =, day_of_week WITH =,
    numrange(public.time_to_min(start_time), public.time_to_min(end_time)) WITH &&
  ) WHERE (room_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT SELECT ON public.timetable_entries TO anon;
GRANT ALL ON public.timetable_entries TO service_role;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

-- School-scoped policies
CREATE POLICY "teachers_select" ON public.teachers FOR SELECT TO authenticated USING (school_id = public.current_school_id());
CREATE POLICY "teachers_write" ON public.teachers FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

CREATE POLICY "subjects_select" ON public.subjects FOR SELECT TO authenticated USING (school_id = public.current_school_id());
CREATE POLICY "subjects_write" ON public.subjects FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

CREATE POLICY "classes_select" ON public.classes FOR SELECT TO authenticated USING (school_id = public.current_school_id());
CREATE POLICY "classes_write" ON public.classes FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

CREATE POLICY "rooms_select" ON public.rooms FOR SELECT TO authenticated USING (school_id = public.current_school_id());
CREATE POLICY "rooms_write" ON public.rooms FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

CREATE POLICY "class_subjects_select" ON public.class_subjects FOR SELECT TO authenticated USING (school_id = public.current_school_id());
CREATE POLICY "class_subjects_write" ON public.class_subjects FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

CREATE POLICY "teacher_subjects_select" ON public.teacher_subjects FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.school_id = public.current_school_id()));
CREATE POLICY "teacher_subjects_write" ON public.teacher_subjects FOR ALL TO authenticated
  USING (public.can_manage() AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.school_id = public.current_school_id()))
  WITH CHECK (public.can_manage() AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.school_id = public.current_school_id()));

CREATE POLICY "teacher_unav_select" ON public.teacher_unavailabilities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.school_id = public.current_school_id()));
CREATE POLICY "teacher_unav_write" ON public.teacher_unavailabilities FOR ALL TO authenticated
  USING (public.can_manage() AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.school_id = public.current_school_id()))
  WITH CHECK (public.can_manage() AND EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.school_id = public.current_school_id()));

CREATE POLICY "versions_select" ON public.timetable_versions FOR SELECT TO authenticated USING (school_id = public.current_school_id());
CREATE POLICY "versions_write" ON public.timetable_versions FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

CREATE POLICY "entries_select" ON public.timetable_entries FOR SELECT TO authenticated USING (school_id = public.current_school_id());
CREATE POLICY "entries_write" ON public.timetable_entries FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

-- Public (anon) read access limited to publicly shared timetable versions
CREATE POLICY "versions_public_read" ON public.timetable_versions FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "entries_public_read" ON public.timetable_entries FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.timetable_versions v WHERE v.id = timetable_version_id AND v.is_public = true));
CREATE POLICY "schools_public_read" ON public.schools FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.timetable_versions v WHERE v.school_id = id AND v.is_public = true));
CREATE POLICY "classes_public_read" ON public.classes FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.timetable_versions v WHERE v.school_id = classes.school_id AND v.is_public = true));
CREATE POLICY "subjects_public_read" ON public.subjects FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.timetable_versions v WHERE v.school_id = subjects.school_id AND v.is_public = true));
CREATE POLICY "teachers_public_read" ON public.teachers FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.timetable_versions v WHERE v.school_id = teachers.school_id AND v.is_public = true));
CREATE POLICY "rooms_public_read" ON public.rooms FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.timetable_versions v WHERE v.school_id = rooms.school_id AND v.is_public = true));
