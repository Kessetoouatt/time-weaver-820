DROP POLICY IF EXISTS schools_insert_any_auth ON public.schools;
REVOKE INSERT ON public.schools FROM authenticated;