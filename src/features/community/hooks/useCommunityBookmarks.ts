import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityBookmarks.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptCommunityPost } from "../adapter";
import type { CommunityPost } from "../types";

export function useCommunityBookmarks() {
  const bookmarksQuery = useQuery(api.community.listBookmarks, {});
  const toggleBookmark = useMutation(api.community.toggleBookmark);

  const bookmarks: CommunityPost[] =
    bookmarksQuery?.map((p: any) => adaptCommunityPost(p)) ?? [];

  const addBookmark = async (publicationId: Id<"publications">) => {
    try {
      await toggleBookmark({ publicationId });
      UIService.openToast("Ajouté aux favoris", "success");
    } catch (error) {
      UIService.openToast("Erreur lors de l'ajout aux favoris", "error");
      throw error;
    }
  };

  const removeBookmark = async (publicationId: Id<"publications">) => {
    try {
      await toggleBookmark({ publicationId });
      UIService.openToast("Retiré des favoris", "success");
    } catch (error) {
      UIService.openToast("Erreur lors du retrait des favoris", "error");
      throw error;
    }
  };

  return {
    bookmarks,
    isLoading: bookmarksQuery === undefined,
    addBookmark,
    removeBookmark,
  };
}
