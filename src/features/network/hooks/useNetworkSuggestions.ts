// src/features/network/hooks/useNetworkSuggestions.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { Suggestion } from "../components/Network/NetworkSuggestions";

interface UseNetworkSuggestionsOptions {
  limit?: number;
  refresh?: number; // Pour forcer le re-fetch
}

/**
 * Récupère les suggestions de personnes à suivre.
 */
export function useNetworkSuggestions(
  options: UseNetworkSuggestionsOptions = {},
) {
  const { user: firebaseUser } = useFirebaseAuth();
  // 'limit' n'est pas requis par la signature stricte de la fonction Convex
  const { refresh } = options;

  const isAuthenticated = !!firebaseUser;

  // ✅ Correction : pointe vers le moteur DébrouilleAI unifié (getNetworkSuggestions)
  // et passe un argument vide {} à la place de { limit } pour satisfaire le compilateur [1]
  const suggestions = useQuery(
    api.network.getNetworkSuggestions,
    isAuthenticated ? {} : "skip",
  );

  return {
    suggestions: suggestions as unknown as Suggestion[] | undefined,
    isLoading: suggestions === undefined,
    isEmpty: suggestions?.length === 0,
  };
}
