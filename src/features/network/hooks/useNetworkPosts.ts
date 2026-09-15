// src/features/network/hooks/useNetworkPosts.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export interface NetworkPost {
  _id: Id<"publications">;
  title?: string;
  description: string;
  images?: string[];
  type: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  authorName: string;
  authorAvatar?: string;
}

interface UseNetworkPostsOptions {
  userId?: Id<"users">;
  limit?: number;
  type?: "all" | "text" | "image" | "video" | "link";
}

/**
 * Récupère les publications d'un utilisateur ou du réseau.
 */
export function useNetworkPosts({ userId }: UseNetworkPostsOptions = {}) {
  // ✅ Correction : utilise l'API de flux d'actualités de community (listFeed) avec filtre sélectif
  const posts = useQuery(api.community.listFeed, {
    filter: userId ? "mine" : "all",
  });

  // ✅ Correction : pointe vers les mutations existantes de community.ts
  const likePost = useMutation(api.community.likePost);
  const deletePost = useMutation(api.community.deletePost);

  const handleLike = async (postId: Id<"publications">, isLiked: boolean) => {
    try {
      // ✅ Correction : utilise l'argument 'publicationId' attendu par la mutation
      await likePost({ publicationId: postId });
    } catch {
      toast.error("Impossible de modifier le like");
    }
  };

  const handleDelete = async (postId: Id<"publications">) => {
    try {
      // ✅ Correction : utilise l'argument 'publicationId' attendu par la mutation
      await deletePost({ publicationId: postId });
      toast.success("Publication supprimée");
      return true;
    } catch {
      toast.error("Impossible de supprimer la publication");
      return false;
    }
  };

  return {
    posts: posts as unknown as NetworkPost[] | undefined,
    isLoading: posts === undefined,
    isEmpty: posts?.length === 0,
    likePost: handleLike,
    deletePost: handleDelete,
  };
}
