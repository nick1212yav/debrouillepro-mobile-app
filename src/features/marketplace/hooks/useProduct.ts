// src/features/marketplace/hooks/useProduct.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

export function useProduct(productId: Id<"products"> | undefined) {
  const productData = useQuery(
    api.commerce.getProduct,
    productId ? { id: productId } : "skip",
  );

  if (!productData) {
    return { product: null, isLoading: true };
  }

  return { product: adaptProduct(productData), isLoading: false };
}
