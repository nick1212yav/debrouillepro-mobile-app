// src/features/marketplace/hooks/useMarketplace.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useMarketplace() {
  const categories = useQuery(api.commerce.getCategories, {});
  const stats = useQuery(api.commerce.getMarketplaceStats, {});

  return {
    categories: categories ?? [],
    stats: stats ?? { totalProducts: 0, totalSellers: 0 },
    isLoading: categories === undefined || stats === undefined,
  };
}
