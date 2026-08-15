import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export function useCrud(table: string) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries();

  return {
    async create(values: Record<string, unknown>) {
      const { error } = await supabase.from(table as never).insert(values as never);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Enregistré.");
      await refresh();
      return true;
    },
    async update(id: string, values: Record<string, unknown>) {
      const { error } = await supabase.from(table as never).update(values as never).eq("id", id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Modifié.");
      await refresh();
      return true;
    },
    async remove(id: string) {
      const { error } = await supabase.from(table as never).delete().eq("id", id);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("Supprimé.");
      await refresh();
      return true;
    },
  };
}
