// src/features/marketplace/hooks/useMarketplaceAnalytics.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useMarketplaceAnalytics() {
  const analytics = useQuery(api.commerce.getMarketplaceAnalytics, {});

  return {
    analytics: analytics ?? null,
    isLoading: analytics === undefined,
  };
}
