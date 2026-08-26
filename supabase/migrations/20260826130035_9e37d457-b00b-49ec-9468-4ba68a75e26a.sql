CREATE POLICY "school_logos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text);

CREATE POLICY "school_logos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage());

CREATE POLICY "school_logos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage())
  WITH CHECK (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage());

CREATE POLICY "school_logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = public.current_school_id()::text AND public.can_manage());