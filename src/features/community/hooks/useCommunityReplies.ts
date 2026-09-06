import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityReplies.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptCommunityComment } from "../adapter";

export function useCommunityReplies() {
  const addReply = useMutation(api.community.addReply);
  const deleteReply = useMutation(api.community.deleteComment);

  return {
    addReply: async ({
      postId,
      parentId,
      text,
    }: {
      postId: Id<"publications">;
      parentId: Id<"comments">;
      text: string;
    }) => {
      try {
        const reply = await addReply({ postId, parentId, text });
        if (!reply) {
          UIService.openToast("Erreur lors de l'ajout de la réponse", "error");
          return;
        }
        UIService.openToast("Réponse ajoutée", "success");
        return adaptCommunityComment(reply);
      } catch (error) {
        UIService.openToast("Erreur lors de l'ajout de la réponse", "error");
        throw error;
      }
    },
    deleteReply: async (replyId: Id<"comments">) => {
      try {
        await deleteReply({ commentId: replyId });
        UIService.openToast("Réponse supprimée", "success");
      } catch (error) {
        UIService.openToast("Erreur lors de la suppression", "error");
        throw error;
      }
    },
  };
}
