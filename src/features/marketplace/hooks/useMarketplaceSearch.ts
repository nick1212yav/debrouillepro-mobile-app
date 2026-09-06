// src/features/marketplace/hooks/useMarketplaceSearch.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";

export function useMarketplaceSearch(query: string, filters: any = {}) {
  const results = useQuery(
    api.commerce.searchProducts,
    query ? { query, ...filters } : "skip",
  );

  return {
    results: (results ?? []).map(adaptProduct),
    isLoading: results === undefined,
  };
}
