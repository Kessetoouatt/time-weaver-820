ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS reference_code text,
  ADD COLUMN IF NOT EXISTS head_name text;

CREATE TABLE IF NOT EXISTS public.school_breaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Pause',
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_breaks TO authenticated;
GRANT ALL ON public.school_breaks TO service_role;

ALTER TABLE public.school_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_breaks_select" ON public.school_breaks
  FOR SELECT TO authenticated
  USING (school_id = public.current_school_id());

CREATE POLICY "school_breaks_write" ON public.school_breaks
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id() AND public.can_manage())
  WITH CHECK (school_id = public.current_school_id() AND public.can_manage());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_school_breaks_updated_at ON public.school_breaks;
CREATE TRIGGER update_school_breaks_updated_at
  BEFORE UPDATE ON public.school_breaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;

-- Matières préenregistrées pour tout nouvel établissement
CREATE OR REPLACE FUNCTION public.seed_default_subjects(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  names text[] := ARRAY['Mathématiques','Physique-Chimie','Anglais','Français','Philosophie','Histoire-Géographie','EPS','Espagnol','Allemand','Musique','Arts plastiques','SVT'];
  colors text[] := ARRAY['#2563eb','#0ea5e9','#059669','#d97706','#dc2626','#7c3aed','#db2777','#0891b2','#65a30d','#ea580c','#f59e0b','#14b8a6'];
  i int;
BEGIN
  FOR i IN 1..array_length(names, 1) LOOP
    INSERT INTO public.subjects (school_id, name, color, color_index)
    SELECT _school_id, names[i], colors[i], i - 1
    WHERE NOT EXISTS (
      SELECT 1 FROM public.subjects s WHERE s.school_id = _school_id AND lower(s.name) = lower(names[i])
    );
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_default_subjects(uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_school_and_join(_name text, _type text, _days text[], _start time without time zone, _end time without time zone, _slot integer, _break_start time without time zone DEFAULT NULL::time without time zone, _break_end time without time zone DEFAULT NULL::time without time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  IF (SELECT school_id FROM public.profiles WHERE id = uid) IS NOT NULL THEN
    RAISE EXCEPTION 'Un établissement est déjà rattaché à ce compte';
  END IF;

  INSERT INTO public.schools (name, type, days_of_week, day_start_time, day_end_time, slot_duration_minutes, lunch_enabled, lunch_start_time, lunch_end_time)
  VALUES (_name, _type, _days, _start, _end, _slot, (_break_start IS NOT NULL AND _break_end IS NOT NULL), _break_start, _break_end)
  RETURNING id INTO new_id;

  INSERT INTO public.profiles (id, school_id)
  VALUES (uid, new_id)
  ON CONFLICT (id) DO UPDATE SET school_id = EXCLUDED.school_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _break_start IS NOT NULL AND _break_end IS NOT NULL THEN
    INSERT INTO public.school_breaks (school_id, label, start_time, end_time)
    VALUES (new_id, 'Pause déjeuner', _break_start, _break_end);
  END IF;

  PERFORM public.seed_default_subjects(new_id);

  RETURN new_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_school_and_join(text, text, text[], time, time, integer, time, time) FROM anon;