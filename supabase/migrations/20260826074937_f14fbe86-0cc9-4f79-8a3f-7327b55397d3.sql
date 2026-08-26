-- 1. Remove anonymous direct table access; public sharing is served server-side
DROP POLICY IF EXISTS schools_public_read ON public.schools;
DROP POLICY IF EXISTS teachers_public_read ON public.teachers;
DROP POLICY IF EXISTS classes_public_read ON public.classes;
DROP POLICY IF EXISTS subjects_public_read ON public.subjects;
DROP POLICY IF EXISTS rooms_public_read ON public.rooms;
DROP POLICY IF EXISTS versions_public_read ON public.timetable_versions;
DROP POLICY IF EXISTS entries_public_read ON public.timetable_entries;

REVOKE ALL ON public.schools FROM anon;
REVOKE ALL ON public.teachers FROM anon;
REVOKE ALL ON public.classes FROM anon;
REVOKE ALL ON public.subjects FROM anon;
REVOKE ALL ON public.rooms FROM anon;
REVOKE ALL ON public.timetable_versions FROM anon;
REVOKE ALL ON public.timetable_entries FROM anon;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.class_subjects FROM anon;
REVOKE ALL ON public.teacher_subjects FROM anon;
REVOKE ALL ON public.teacher_unavailabilities FROM anon;
REVOKE ALL ON public.user_roles FROM anon;

-- 2. Profiles: users may only read their own profile row
DROP POLICY IF EXISTS profiles_select_own_or_school ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 3. SECURITY DEFINER functions: not callable by anonymous users
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE ALL ON FUNCTION public.current_school_id() FROM anon, public;
REVOKE ALL ON FUNCTION public.can_manage() FROM anon, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.create_school_and_join(text, text, text[], time, time, int, time, time) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_school_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_school_and_join(text, text, text[], time, time, int, time, time) TO authenticated, service_role;

-- 4. Ensure fixed search_path on all project functions
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.current_school_id() SET search_path = public;
ALTER FUNCTION public.can_manage() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.create_school_and_join(text, text, text[], time, time, int, time, time) SET search_path = public;
ALTER FUNCTION public.time_to_min(time) SET search_path = public;