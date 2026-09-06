// src/features/community/hooks/useCommunityAnalytics.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useCommunityAnalytics(postId?: Id<"publications">) {
  const analytics = useQuery(
    api.community.getAnalytics,
    postId ? { postId } : "skip",
  );

  return {
    analytics: analytics || null,
    isLoading: analytics === undefined,
  };
}
