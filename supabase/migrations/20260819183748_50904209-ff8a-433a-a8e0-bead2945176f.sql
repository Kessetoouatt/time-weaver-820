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

  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.time_to_min(t time without time zone)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT EXTRACT(EPOCH FROM t) / 60
$function$;