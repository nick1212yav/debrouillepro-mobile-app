import { UIService } from "@/core/sdk/ui/UIService";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useAnnonceLifecycle() {
  const create = useMutation(api.publications.createPublication);
  // ✅ updatePublication existe maintenant dans publications.ts
  const update = useMutation(api.publications.updatePublication);
  // ✅ deletePublication existe
  const remove = useMutation(api.publications.deletePublication);

  const handleCreate = async (data: any) => {
    try {
      const result = await create(data);
      UIService.openToast("Annonce créée avec succès !", "success");
      return result;
    } catch (error) {
      UIService.openToast("Erreur lors de la création", "error");
      throw error; // ✅ corrigé
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await update({ publicationId: id as Id<"publications">, ...data });
      UIService.openToast("Annonce mise à jour", "success");
    } catch (error) {
      UIService.openToast("Erreur lors de la mise à jour", "error");
      throw error; // ✅ corrigé
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // ✅ corrigé : publicationId au lieu de id
      await remove({ publicationId: id as Id<"publications"> });
      UIService.openToast("Annonce supprimée", "success");
    } catch (error) {
      UIService.openToast("Erreur lors de la suppression", "error");
      throw error; // ✅ corrigé
    }
  };

  return { handleCreate, handleUpdate, handleDelete };
}
