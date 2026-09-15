// src/features/community/hooks/useCommunityBookmarks.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
      toast.success("Ajouté aux favoris");
    } catch (error) {
      toast.error("Erreur lors de l'ajout aux favoris");
      throw error;
    }
  };

  const removeBookmark = async (publicationId: Id<"publications">) => {
    try {
      await toggleBookmark({ publicationId });
      toast.success("Retiré des favoris");
    } catch (error) {
      toast.error("Erreur lors du retrait des favoris");
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
