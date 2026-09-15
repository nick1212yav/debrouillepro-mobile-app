// src/features/community/hooks/useCommunityAI.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useCommunityAI() {
  const translateText = useMutation(api.community.translateText);
  const summarizeText = useMutation(api.community.summarizeText);
  const moderateText = useMutation(api.community.moderateText);
  const suggestHashtags = useMutation(api.community.suggestHashtags);
  const generateReply = useMutation(api.community.generateReply);

  return {
    translateText: async (text: string, targetLang: string) => {
      try {
        const result = await translateText({ text, targetLang });
        return result.translatedText;
      } catch (error) {
        toast.error("Erreur de traduction");
        throw error;
      }
    },
    summarizeText: async (text: string) => {
      try {
        const result = await summarizeText({ text });
        return result.summary;
      } catch (error) {
        toast.error("Erreur de résumé");
        throw error;
      }
    },
    moderateText: async (text: string) => {
      try {
        const result = await moderateText({ text });
        return result;
      } catch (error) {
        toast.error("Erreur de modération");
        throw error;
      }
    },
    suggestHashtags: async (text: string) => {
      try {
        const result = await suggestHashtags({ text });
        return result.hashtags;
      } catch (error) {
        toast.error("Erreur de suggestion de hashtags");
        throw error;
      }
    },
    generateReply: async (commentId: Id<"comments">, context: string) => {
      try {
        const result = await generateReply({ commentId, context });
        return result.reply;
      } catch (error) {
        toast.error("Erreur de génération de réponse");
        throw error;
      }
    },
  };
}
