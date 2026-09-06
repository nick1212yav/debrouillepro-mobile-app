// src/features/marketplace/hooks/useRecommendations.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

export function useRecommendations(productId: Id<"products"> | undefined) {
  const recsData = useQuery(
    api.commerce.getRecommendations,
    productId ? { productId } : "skip",
  );

  const products = (recsData ?? []).map(adaptProduct);

  return { products, isLoading: recsData === undefined };
}
