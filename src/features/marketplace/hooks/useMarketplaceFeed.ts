// src/features/marketplace/hooks/useMarketplaceFeed.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";

export function useMarketplaceFeed() {
  // ⚠️ getFeed n'existe pas – on utilise listProducts à la place
  const feedData = useQuery(api.commerce.listProducts, {
    paginationOpts: { numItems: 20, cursor: null },
  });

  const products = (feedData?.page ?? []).map(adaptProduct);

  return { products, isLoading: feedData === undefined };
}
