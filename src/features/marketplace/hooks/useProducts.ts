// src/features/marketplace/hooks/useProducts.ts
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";
import type { MarketplaceFilters } from "../types";

export function useProducts(
  filters: MarketplaceFilters = {},
  initialNumItems: number = 12,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.commerce.listProducts,
    filters,
    { initialNumItems },
  );

  const products = (results ?? []).map(adaptProduct);

  return {
    products,
    isLoading: status === "LoadingFirstPage",
    isLoadingMore: status === "LoadingMore",
    hasMore: status === "CanLoadMore",
    loadMore,
  };
}
