// src/features/marketplace/hooks/useAISuggestions.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useAISuggestions(productId?: string) {
  // Temporairement désactivé car api.ai.getProductSuggestions n'existe pas
  // const suggestions = useQuery(api.ai.getProductSuggestions, productId ? { productId } : "skip");

  return {
    suggestions: [],
    isLoading: false,
  };
}
