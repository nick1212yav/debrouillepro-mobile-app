// src/features/network/hooks/useNetwork.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook d'accès général pour l'état du réseau.
 */
export function useNetwork() {
  // ✅ Correction : getFeed inexistant -> redirigé vers l'API de suggestions unifiée [1]
  const feed = useQuery(api.network.getNetworkSuggestions, {});
  return {
    feed,
    isLoading: feed === undefined,
  };
}
