// src/features/community/hooks/useCommunityStories.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptCommunityStory } from "../adapter";
import type { CommunityStory } from "../types";

export function useCommunityStories() {
  const storiesQuery = useQuery(api.community.listStories, {});
  const createStory = useMutation(api.community.createStory);
  const viewStory = useMutation(api.community.viewStory);
  const deleteStory = useMutation(api.community.deleteStory);

  const stories: CommunityStory[] =
    storiesQuery?.map((s: any) => adaptCommunityStory(s)) ?? [];

  return {
    stories,
    isLoading: storiesQuery === undefined,

    createStory: async (data: {
      mediaUrl: string;
      mediaType: "image" | "video";
      caption?: string;
      duration?: number;
    }) => {
      try {
        const storyId = await createStory(data);
        toast.success("Story publiée");
        return storyId;
      } catch (error) {
        toast.error("Erreur lors de la publication de la story");
        throw error;
      }
    },

    viewStory: async (storyId: Id<"stories">) => {
      try {
        await viewStory({ storyId });
      } catch (error) {
        console.error("Erreur lors du visionnage de la story", error);
      }
    },

    deleteStory: async (storyId: Id<"stories">) => {
      try {
        // community.deleteStory supprime par lots de 500 vues.
        // Tant que le serveur retourne pendingCleanup: true, la suppression
        // n'est pas terminée. On relance jusqu'à success: true.
        // Sans cette boucle : toast "supprimée" alors que la suppression
        // est partielle → violation de vérité UI.
        let result = await deleteStory({ storyId });

        while (!result.success && result.pendingCleanup) {
          result = await deleteStory({ storyId });
        }

        if (!result.success) {
          throw new Error(
            "La suppression de la story n'a pas été confirmée par le serveur.",
          );
        }

        toast.success("Story supprimée");
        return result;
      } catch (error) {
        toast.error("Erreur lors de la suppression");
        throw error;
      }
    },
  };
}
