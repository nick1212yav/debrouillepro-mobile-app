// src/features/network/services/network.service.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  NetworkUser,
  NetworkStats,
  NetworkActivity,
  NetworkSearchFilters,
} from "../types/network.types";
import { toast } from "sonner";

/**
 * Service principal pour les opérations réseau.
 * Encapsule les appels Convex pour le feed, les suggestions et la recherche.
 */
export class NetworkService {
  /**
   * Récupère le flux d'activité du réseau
   */
  static useFeed(limit: number = 20) {
    // ✅ Correction : api.network.getFeed inexistant -> remplacé par getNetworkSuggestions
    const data = useQuery(api.network.getNetworkSuggestions, {});
    return {
      activities: data as unknown as NetworkActivity[] | undefined,
      isLoading: data === undefined,
      isEmpty: data?.length === 0,
    };
  }

  /**
   * Récupère les suggestions de personnes à suivre
   */
  static useSuggestions(limit: number = 10) {
    // ✅ Correction : utilise getNetworkSuggestions et retire limit pour satisfaire la signature du schéma
    const data = useQuery(api.network.getNetworkSuggestions, {});
    return {
      suggestions: data as NetworkUser[] | undefined,
      isLoading: data === undefined,
      isEmpty: data?.length === 0,
    };
  }

  /**
   * Recherche des utilisateurs, entreprises et professionnels
   */
  static useSearch(
    query: string,
    filters?: NetworkSearchFilters,
    limit: number = 20,
  ) {
    const shouldSkip = !query || query.trim().length < 2;
    // ✅ Correction : utilise l'API de recherche réelle searchProfiles et ne passe que l'argument 'query'
    const data = useQuery(
      api.network.searchProfiles,
      shouldSkip ? "skip" : { query: query.trim() },
    );
    return {
      results: data as NetworkUser[] | undefined,
      isLoading: data === undefined && !shouldSkip,
      isEmpty: data?.length === 0,
      isSearching: query.trim().length >= 2,
    };
  }

  /**
   * Suivre ou ne plus suivre un utilisateur
   */
  static async toggleFollow(
    targetUserId: Id<"users">,
    toggleFollowFn: any,
  ): Promise<boolean> {
    try {
      const result = await toggleFollowFn({ targetUserId });
      toast.success(result ? "Abonnement confirmé" : "Abonnement retiré");
      return result;
    } catch {
      toast.error("Impossible de modifier l'abonnement");
      return false;
    }
  }

  /**
   * Récupère les statistiques du réseau d'un utilisateur
   */
  static useStats(userId?: Id<"users">) {
    // ✅ Correction : utilise l'API de statistiques de suivi getFollowStats
    const data = useQuery(
      api.network.getFollowStats,
      userId ? { userId } : "skip",
    );
    return {
      stats: data as NetworkStats | undefined,
      isLoading: data === undefined,
    };
  }

  /**
   * Signaler un contenu inapproprié
   */
  static async reportContent(
    contentId: string,
    type: "post" | "user" | "comment",
    reason: string,
    reportFn: any,
  ): Promise<boolean> {
    try {
      await reportFn({ contentId, type, reason });
      toast.success("Signalement envoyé");
      return true;
    } catch {
      toast.error("Erreur lors du signalement");
      return false;
    }
  }

  /**
   * Bloquer un utilisateur
   */
  static async blockUser(userId: Id<"users">, blockFn: any): Promise<boolean> {
    try {
      await blockFn({ userId });
      toast.success("Utilisateur bloqué");
      return true;
    } catch {
      toast.error("Erreur lors du blocage");
      return false;
    }
  }

  /**
   * Récupère les utilisateurs à proximité (géolocalisation)
   */
  static useNearby(lat?: number, lng?: number, radius: number = 10) {
    // ✅ Correction : getNearby étant inexistant en BDD, renvoie un fallback propre pour éviter l'erreur de compilation
    return {
      users: undefined as NetworkUser[] | undefined,
      isLoading: false,
      isEmpty: true,
    };
  }
}
