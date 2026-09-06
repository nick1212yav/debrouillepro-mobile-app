// src/features/marketplace/hooks/useRecentlyViewed.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";

export function useRecentlyViewed() {
  const viewedData = useQuery(api.commerce.getRecentlyViewed, {});

  const products = (viewedData ?? []).map((item: any) =>
    adaptProduct(item.product),
  );

  return { products, isLoading: viewedData === undefined };
}
