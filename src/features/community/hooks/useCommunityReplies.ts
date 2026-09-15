// src/features/community/hooks/useCommunityReplies.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
          toast.error("Erreur lors de l'ajout de la réponse");
          return;
        }
        toast.success("Réponse ajoutée");
        return adaptCommunityComment(reply);
      } catch (error) {
        toast.error("Erreur lors de l'ajout de la réponse");
        throw error;
      }
    },
    deleteReply: async (replyId: Id<"comments">) => {
      try {
        await deleteReply({ commentId: replyId });
        toast.success("Réponse supprimée");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
        throw error;
      }
    },
  };
}
