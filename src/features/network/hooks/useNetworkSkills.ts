// src/features/network/hooks/useNetworkSkills.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkSkill } from "../types/skill.types";
import { toast } from "sonner";

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
      toast.success("Compétence ajoutée");
      return id;
    } catch {
      toast.error("Erreur lors de l'ajout");
      return null;
    }
  };

  const handleDelete = async (skillId: Id<"networkSkills">) => {
    // ✅ Correction : typé Id<"networkSkills"> au lieu de string
    try {
      await deleteSkill({ id: skillId });
      toast.success("Compétence supprimée");
      return true;
    } catch {
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  const handleEndorse = async (skillId: Id<"networkSkills">) => {
    // ✅ Correction : typé Id<"networkSkills"> au lieu de string
    try {
      await endorseSkill({ skillId });
      toast.success("Recommandation ajoutée");
      return true;
    } catch {
      toast.error("Erreur lors de la recommandation");
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
