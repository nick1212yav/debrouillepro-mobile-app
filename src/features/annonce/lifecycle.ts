import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
      toast.success("Annonce créée avec succès !");
      return result;
    } catch (error) {
      toast.error("Erreur lors de la création");
      throw error; // ✅ corrigé
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      await update({ publicationId: id as Id<"publications">, ...data });
      toast.success("Annonce mise à jour");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      throw error; // ✅ corrigé
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // ✅ corrigé : publicationId au lieu de id
      await remove({ publicationId: id as Id<"publications"> });
      toast.success("Annonce supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
      throw error; // ✅ corrigé
    }
  };

  return { handleCreate, handleUpdate, handleDelete };
}
