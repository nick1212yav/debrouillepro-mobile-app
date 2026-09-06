import { UIService } from "@/core/sdk/ui/UIService";

// src/features/network/hooks/useNetworkExperience.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkExperience } from "../types/experience.types";

interface UseNetworkExperienceOptions {
  userId: Id<"users">;
}

/**
 * Gère les expériences professionnelles d'un utilisateur.
 */
export function useNetworkExperience({ userId }: UseNetworkExperienceOptions) {
  // ✅ Correction : appel au pluriel "getUserExperiences"
  const experiences = useQuery(api.network.getUserExperiences, { userId });

  const addExperience = useMutation(api.network.addExperience);
  const updateExperience = useMutation(api.network.updateExperience);
  const deleteExperience = useMutation(api.network.deleteExperience);

  const handleAdd = async (data: Omit<NetworkExperience, "_id" | "userId">) => {
    try {
      // ✅ Correction : retrait de 'userId' car l'authentification est déduite côté serveur Convex
      const id = await addExperience(data);
      UIService.openToast("Expérience ajoutée", "success");
      return id;
    } catch {
      UIService.openToast("Erreur lors de l'ajout", "error");
      return null;
    }
  };

  const handleUpdate = async (
    experienceId: Id<"networkExperiences">, // ✅ Correction : typé Id<"networkExperiences"> au lieu de string
    data: Partial<NetworkExperience>,
  ) => {
    try {
      await updateExperience({ id: experienceId, ...data });
      UIService.openToast("Expérience mise à jour", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la mise à jour", "error");
      return false;
    }
  };

  const handleDelete = async (experienceId: Id<"networkExperiences">) => {
    // ✅ Correction : typé Id<"networkExperiences"> au lieu de string
    try {
      await deleteExperience({ id: experienceId });
      UIService.openToast("Expérience supprimée", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
      return false;
    }
  };

  return {
    experiences: experiences as NetworkExperience[] | undefined,
    isLoading: experiences === undefined,
    isEmpty: experiences?.length === 0,
    addExperience: handleAdd,
    updateExperience: handleUpdate,
    deleteExperience: handleDelete,
  };
}
