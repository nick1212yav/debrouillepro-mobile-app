// src/features/agri/hooks/useAgriSeller.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { AgriProduct } from "../types/product.types";

export function useAgriSeller(sellerId: string) {
  const sellerProfile = useQuery(api.agri.getSellerProfile, { sellerId });
  const sellerProducts = useQuery(api.agri.getSellerProducts, { sellerId });

  return {
    sellerProfile,
    sellerProducts: sellerProducts as unknown as AgriProduct[] | undefined,
    isLoading: sellerProfile === undefined || sellerProducts === undefined,
  };
}
