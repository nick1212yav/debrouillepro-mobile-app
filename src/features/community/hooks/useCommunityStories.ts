import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityStories.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
        UIService.openToast("Story publiée", "success");
        // On retourne l'ID, le composant devra rafraîchir
        return storyId;
      } catch (error) {
        UIService.openToast("Erreur lors de la publication de la story", "error");
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
        await deleteStory({ storyId });
        UIService.openToast("Story supprimée", "success");
      } catch (error) {
        UIService.openToast("Erreur lors de la suppression", "error");
        throw error;
      }
    },
  };
}
