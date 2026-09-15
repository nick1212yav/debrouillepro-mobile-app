// src/features/community/hooks/useCommunityReactions.ts
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

// ⚠️ Fonctions de réactions : le backend n'est pas encore implémenté.
// Placeholders pour ne pas casser la compilation.
export function useCommunityReactions() {
  return {
    addReaction: async (publicationId: Id<"publications">, emoji: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.info(`⚠️ Réaction ${emoji} : fonctionnalité à venir`);
      console.log("Ajout réaction :", { publicationId, emoji });
      // Ne pas throw pour ne pas bloquer l'UI
    },

    removeReaction: async (
      publicationId: Id<"publications">,
      emoji: string,
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.info(`⚠️ Retrait de réaction ${emoji} : fonctionnalité à venir`);
      console.log("Retrait réaction :", { publicationId, emoji });
    },
  };
}
