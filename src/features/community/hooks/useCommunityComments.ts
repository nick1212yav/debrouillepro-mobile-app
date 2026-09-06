import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityComments.ts
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptCommunityComment } from "../adapter";
import type { CommunityComment } from "../types";

export function useCommunityComments(postId?: Id<"publications">) {
  const [comments, setComments] = useState<CommunityComment[]>([]);

  const commentsQuery = useQuery(
    api.community.listComments,
    postId ? { postId } : "skip",
  );

  const addCommentMutation = useMutation(api.community.addComment);
  const addReplyMutation = useMutation(api.community.addReply);

  useEffect(() => {
    if (commentsQuery) {
      setComments(commentsQuery.map((c: any) => adaptCommunityComment(c)));
    }
  }, [commentsQuery]);

  const addComment = async (text: string) => {
    if (!postId) return;
    try {
      const newComment = await addCommentMutation({ postId, text });
      if (!newComment) {
        UIService.openToast("Erreur lors de l'ajout du commentaire", "error");
        return;
      }
      const adapted = adaptCommunityComment(newComment);
      setComments((prev) => [...prev, adapted]);
      UIService.openToast("Commentaire ajouté", "success");
      return adapted;
    } catch (error) {
      UIService.openToast("Erreur lors de l'ajout du commentaire", "error");
      throw error;
    }
  };

  const addReply = async (text: string, parentId: Id<"comments">) => {
    if (!postId) return;
    try {
      const reply = await addReplyMutation({ postId, parentId, text });
      if (!reply) {
        UIService.openToast("Erreur lors de l'ajout de la réponse", "error");
        return;
      }
      const adapted = adaptCommunityComment(reply);
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === parentId) {
            return { ...c, replies: [...(c.replies || []), adapted] };
          }
          return c;
        }),
      );
      UIService.openToast("Réponse ajoutée", "success");
      return adapted;
    } catch (error) {
      UIService.openToast("Erreur lors de l'ajout de la réponse", "error");
      throw error;
    }
  };

  return {
    comments,
    addComment,
    addReply,
    isLoading: commentsQuery === undefined,
  };
}
