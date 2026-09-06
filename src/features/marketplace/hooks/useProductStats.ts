// src/features/marketplace/hooks/useProductStats.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useProductStats(productId: Id<"products"> | undefined) {
  const statsData = useQuery(
    api.commerce.getProductStats,
    productId ? { productId } : "skip",
  );

  return { stats: statsData ?? null, isLoading: statsData === undefined };
}
