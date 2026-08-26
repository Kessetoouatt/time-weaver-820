REVOKE ALL ON FUNCTION public.seed_default_subjects(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_default_subjects(uuid) TO service_role;