// src/features/agri/hooks/useAgriProducts.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { AgriProduct, AgriCategory } from "../types/product.types";

interface UseAgriProductsFilters {
  category?: AgriCategory | null;
  location?: string | null;
  sort?: string;
}

export function useAgriProducts(filters?: UseAgriProductsFilters) {
  const products = useQuery(api.agri.listProducts, {
    category: filters?.category || undefined,
    location: filters?.location || undefined,
    sort: filters?.sort || "recent",
  });

  return {
    products: products as unknown as AgriProduct[] | undefined,
    isLoading: products === undefined,
  };
}
