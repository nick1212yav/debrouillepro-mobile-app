import { UIService } from "@/core/sdk/ui/UIService";

// src/features/network/hooks/useNetworkSkills.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkSkill } from "../types/skill.types";

interface UseNetworkSkillsOptions {
  userId: Id<"users">;
}

/**
 * Gère les compétences d'un utilisateur.
 */
export function useNetworkSkills({ userId }: UseNetworkSkillsOptions) {
  const skills = useQuery(api.network.getUserSkills, { userId });

  const addSkill = useMutation(api.network.addSkill);
  const deleteSkill = useMutation(api.network.deleteSkill);
  const endorseSkill = useMutation(api.network.endorseSkill);

  const handleAdd = async (name: string) => {
    try {
      // ✅ Correction : retrait de 'userId' car l'authentification est déduite côté serveur Convex
      const id = await addSkill({ name });
      UIService.openToast("Compétence ajoutée", "success");
      return id;
    } catch {
      UIService.openToast("Erreur lors de l'ajout", "error");
      return null;
    }
  };

  const handleDelete = async (skillId: Id<"networkSkills">) => {
    // ✅ Correction : typé Id<"networkSkills"> au lieu de string
    try {
      await deleteSkill({ id: skillId });
      UIService.openToast("Compétence supprimée", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la suppression", "error");
      return false;
    }
  };

  const handleEndorse = async (skillId: Id<"networkSkills">) => {
    // ✅ Correction : typé Id<"networkSkills"> au lieu de string
    try {
      await endorseSkill({ skillId });
      UIService.openToast("Recommandation ajoutée", "success");
      return true;
    } catch {
      UIService.openToast("Erreur lors de la recommandation", "error");
      return false;
    }
  };

  return {
    skills: skills as NetworkSkill[] | undefined,
    isLoading: skills === undefined,
    isEmpty: skills?.length === 0,
    addSkill: handleAdd,
    deleteSkill: handleDelete,
    endorseSkill: handleEndorse,
  };
}
