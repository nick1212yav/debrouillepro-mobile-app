// src/features/network/hooks/useNetworkSearch.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { Id } from "@/convex/_generated/dataModel";

export interface NetworkSearchResult {
  _id: Id<"users">;
  name: string;
  avatar?: string | null;
  headline?: string;
  city?: string;
  roles?: string[];
  isFollowedByMe?: boolean;
  followerCount: number;
  matchScore?: number;
}

interface UseNetworkSearchOptions {
  query: string;
  limit?: number;
  type?: "all" | "people" | "companies" | "professionals";
}

/**
 * Hook de recherche pour le réseau.
 * Recherche des personnes, entreprises et professionnels.
 */
export function useNetworkSearch(options: UseNetworkSearchOptions) {
  const { user: firebaseUser } = useFirebaseAuth();
  const { query } = options; // 'limit' et 'type' ne sont pas requis par la signature stricte de la fonction de recherche

  const isAuthenticated = !!firebaseUser;
  const shouldSkip = !isAuthenticated || !query || query.trim().length < 2;

  // ✅ Correction : pointe vers 'api.network.searchProfiles' et ne passe que l'argument 'query' attendu [1]
  const results = useQuery(
    api.network.searchProfiles,
    shouldSkip ? "skip" : { query: query.trim() },
  );

  return {
    results: results as unknown as NetworkSearchResult[] | undefined,
    isLoading: results === undefined && !shouldSkip,
    isEmpty: results?.length === 0,
    isSearching: query.trim().length >= 2,
  };
}
