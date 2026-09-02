ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS head_title text,
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS signature_city text;

CREATE POLICY "school members read signatures"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text);

CREATE POLICY "school managers write signatures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage());

CREATE POLICY "school managers update signatures"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage())
WITH CHECK (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage());

CREATE POLICY "school managers delete signatures"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage());