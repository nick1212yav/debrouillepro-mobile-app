// src/features/community/hooks/useCommunityRecommendations.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptCommunityPost } from "../adapter";
import type { CommunityPost } from "../types";

export function useCommunityRecommendations(postId?: Id<"publications">) {
  const recommendationsQuery = useQuery(
    api.community.getRecommendations,
    postId ? { postId } : "skip",
  );

  const posts: CommunityPost[] =
    recommendationsQuery?.map((p: any) => adaptCommunityPost(p)) ?? [];

  return {
    posts,
    isLoading: recommendationsQuery === undefined,
    isEmpty: recommendationsQuery?.length === 0,
  };
}
