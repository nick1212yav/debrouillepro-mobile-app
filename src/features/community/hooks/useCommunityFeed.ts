// src/features/community/hooks/useCommunityFeed.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptCommunityPost } from "../adapter";
import type { CommunityPost } from "../types";

export function useCommunityFeed(
  filter?: "all" | "mine" | "following",
  search?: string,
) {
  const feedQuery = useQuery(api.community.listFeed, { filter, search });

  const posts: CommunityPost[] =
    feedQuery?.map((p: any) => adaptCommunityPost(p)) ?? [];

  return {
    posts,
    isLoading: feedQuery === undefined,
    isEmpty: feedQuery?.length === 0,
  };
}
