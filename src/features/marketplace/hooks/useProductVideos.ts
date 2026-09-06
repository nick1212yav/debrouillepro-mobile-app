// src/features/marketplace/hooks/useProductVideos.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useProductVideos(productId: Id<"products"> | undefined) {
  const videosData = useQuery(
    api.commerce.getProductVideos,
    productId ? { productId } : "skip",
  );

  return { videos: videosData ?? [], isLoading: videosData === undefined };
}
