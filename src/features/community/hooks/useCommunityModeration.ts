import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityModeration.ts
import type { Id } from "@/convex/_generated/dataModel";

// ⚠️ Fonctions de modération : le backend n'est pas encore implémenté.
// Placeholders pour ne pas casser la compilation.
export function useCommunityModeration() {
  return {
    reportContent: async ({
      postId,
      commentId,
      reason,
      details,
    }: {
      postId?: Id<"publications">;
      commentId?: Id<"comments">;
      reason: string;
      details?: string;
    }) => {
      // Simuler un délai
      await new Promise((resolve) => setTimeout(resolve, 500));
      UIService.openToast("⚠️ Signalement : fonctionnalité à venir", "info");
      console.log("Signalement :", { postId, commentId, reason, details });
      // Ne pas throw pour ne pas bloquer l'UI
    },

    moderateContent: async ({
      contentId,
      contentType,
      action,
      reason,
    }: {
      contentId: Id<"publications"> | Id<"comments">;
      contentType: "post" | "comment";
      action: "delete" | "hide" | "flag";
      reason: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      UIService.openToast("⚠️ Modération : fonctionnalité à venir", "info");
      console.log("Modération :", { contentId, contentType, action, reason });
    },

    banUser: async (userId: Id<"users">, reason: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      UIService.openToast("⚠️ Bannissement : fonctionnalité à venir", "info");
      console.log("Bannir :", { userId, reason });
    },

    muteUser: async (userId: Id<"users">, duration: number) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      UIService.openToast("⚠️ Mise en sourdine : fonctionnalité à venir", "info");
      console.log("Mute :", { userId, duration });
    },
  };
}
