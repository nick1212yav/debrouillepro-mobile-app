import { UIService } from "@/core/sdk/ui/UIService";

// src/features/network/hooks/useNetworkEducation.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkEducation } from "../types/education.types";

interface UseNetworkEducationOptions {
  userId: Id<"users">;
}

/**
 * Gère les formations d'un utilisateur.
 */
export function useNetworkEducation({ userId }: UseNetworkEducationOptions) {
  // ✅ Correction : appel au pluriel "getUserEducations"
  const educations = useQuery(api.network.getUserEducations, { userId });

  const addEducation = useMutation(api.network.addEducation);
  const updateEducation = useMutation(api.network.updateEducation);
  const deleteEducation = useMutation(api.network.deleteEducation);

  const handleAdd = async (data: Omit<NetworkEducation, "_id" | "userId">) => {
    try {
      // ✅ Correction : retrait de 'userId' car l'authentification est déduite côté serveur Convex
      const id = await addEducation(data);
      UIService.openToast("Formation ajoutée", "success");
      return id;
    } catch {
      UIService.openToast("Erreur lors de l'ajout", "error");
      return null;
    }
  };

  const handleUpdate = async (
    educationId: Id<"networkEducations">, // ✅ Correction : typé Id<"networkEducations"> au lieu de string
    data: Partial<NetworkEducation>,
  ) => {
    try {
      await updateEducation({ id: educationId, ...data });
      UIService.openToast("Formation mise à jour", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la mise à jour", "error");
      return false;
    }
  };

  const handleDelete = async (educationId: Id<"networkEducations">) => {
    // ✅ Correction : typé Id<"networkEducations"> au lieu de string
    try {
      await deleteEducation({ id: educationId });
      UIService.openToast("Formation supprimée", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
      return false;
    }
  };

  return {
    educations: educations as NetworkEducation[] | undefined,
    isLoading: educations === undefined,
    isEmpty: educations?.length === 0,
    addEducation: handleAdd,
    updateEducation: handleUpdate,
    deleteEducation: handleDelete,
  };
}
