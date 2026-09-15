// src/features/events/hooks/useEventComments.ts
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptEventComment } from "../adapter";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import type { EventComment } from "../types";

export function useEventComments(eventId?: Id<"events">): {
  comments: EventComment[];
  addComment: (text: string) => Promise<void>;
  addReply: (text: string, parentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  isLoading: boolean;
} {
  const [comments, setComments] = useState<EventComment[]>([]);

  const commentsData = useQuery(
    api.events.listComments,
    eventId ? { eventId } : "skip",
  );

  const addCommentMutation = useMutation(api.events.addComment);
  const addReplyMutation = useMutation(api.events.addReply);
  const likeCommentMutation = useMutation(api.events.likeComment);

  useEffect(() => {
    if (commentsData) {
      setComments(commentsData.map((c: any) => adaptEventComment(c)));
    }
  }, [commentsData]);

  const addComment = async (text: string): Promise<void> => {
    if (!eventId) return;
    try {
      const newComment = await addCommentMutation({ eventId, text });
      if (newComment) {
        const adapted = adaptEventComment(newComment);
        setComments((prev) => [...prev, adapted]);
      }
      toast.success("Commentaire ajouté");
    } catch (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
      throw error;
    }
  };

  const addReply = async (text: string, parentId: string): Promise<void> => {
    if (!eventId) return;
    try {
      const reply = await addReplyMutation({
        eventId,
        parentId: parentId as Id<"eventComments">,
        text,
      });
      if (reply) {
        const adapted = adaptEventComment(reply);
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === parentId) {
              return { ...c, replies: [...(c.replies || []), adapted] };
            }
            return c;
          }),
        );
      }
      toast.success("Réponse ajoutée");
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la réponse");
      throw error;
    }
  };

  const likeComment = async (commentId: string): Promise<void> => {
    try {
      await likeCommentMutation({
        commentId: commentId as Id<"eventComments">,
      });
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            return {
              ...c,
              likedByMe: !c.likedByMe,
              likeCount: c.likedByMe ? c.likeCount - 1 : c.likeCount + 1,
            };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => {
                if (r._id === commentId) {
                  return {
                    ...r,
                    likedByMe: !r.likedByMe,
                    likeCount: r.likedByMe ? r.likeCount - 1 : r.likeCount + 1,
                  };
                }
                return r;
              }),
            };
          }
          return c;
        }),
      );
    } catch {
      toast.error("Erreur lors du like");
    }
  };

  return {
    comments,
    addComment,
    addReply,
    likeComment,
    isLoading: commentsData === undefined,
  };
}
