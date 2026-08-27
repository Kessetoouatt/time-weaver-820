import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchoolData";

/** Résout une URL signée affichable pour le logo de l'établissement. */
export function useSchoolLogo(): string | null {
  const { data: school } = useSchool();
  const path = school?.logo_url ?? null;

  const { data } = useQuery({
    queryKey: ["school-logo", path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data: signed, error } = await supabase.storage
        .from("school-logos")
        .createSignedUrl(path!, 60 * 60 * 24);
      if (error) return null;
      return signed?.signedUrl ?? null;
    },
  });

  return data ?? null;
}
