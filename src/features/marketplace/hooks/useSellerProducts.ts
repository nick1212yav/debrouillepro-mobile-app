// src/features/marketplace/hooks/useSellerProducts.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

export function useSellerProducts(sellerId: Id<"users"> | undefined) {
  const productsData = useQuery(
    api.commerce.listProducts,
    sellerId
      ? { sellerId, paginationOpts: { numItems: 50, cursor: null } }
      : "skip",
  );

  const products = (productsData?.page ?? []).map(adaptProduct);

  return { products, isLoading: productsData === undefined };
}
