import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchoolData";

function useSignedSchoolFile(path: string | null): string | null {
  const { data } = useQuery({
    queryKey: ["school-file", path],
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

/** Résout une URL signée affichable pour le logo de l'établissement. */
export function useSchoolLogo(): string | null {
  const { data: school } = useSchool();
  return useSignedSchoolFile(school?.logo_url ?? null);
}

/** Résout une URL signée pour l'image de signature du chef d'établissement. */
export function useSchoolSignature(): string | null {
  const { data: school } = useSchool();
  return useSignedSchoolFile(school?.signature_url ?? null);
}
