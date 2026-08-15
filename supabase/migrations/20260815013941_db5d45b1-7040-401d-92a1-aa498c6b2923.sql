
CREATE OR REPLACE FUNCTION public.create_school_and_join(
  _name text,
  _type text,
  _days text[],
  _start time,
  _end time,
  _slot int,
  _break_start time DEFAULT NULL,
  _break_end time DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.schools (name, type, days_of_week, day_start_time, day_end_time, slot_duration_minutes, break_start_time, break_end_time)
  VALUES (_name, _type, _days, _start, _end, _slot, _break_start, _break_end)
  RETURNING id INTO new_id;

  INSERT INTO public.profiles (id, school_id)
  VALUES (uid, new_id)
  ON CONFLICT (id) DO UPDATE SET school_id = EXCLUDED.school_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_school_and_join(text, text, text[], time, time, int, time, time) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_school_and_join(text, text, text[], time, time, int, time, time) TO authenticated;
