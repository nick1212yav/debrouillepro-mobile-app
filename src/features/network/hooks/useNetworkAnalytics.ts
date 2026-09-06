// src/features/network/hooks/useNetworkAnalytics.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { Id } from "@/convex/_generated/dataModel";

export interface NetworkAnalytics {
  profileViews: number;
  profileViewsChange: number; // en pourcentage
  connectionsGained: number;
  connectionsGainedChange: number;
  postsEngagement: number;
  postsEngagementChange: number;
  searchAppearances: number;
  searchAppearancesChange: number;
  opportunitiesGenerated: number;
  opportunitiesGeneratedChange: number;
}

interface UseNetworkAnalyticsOptions {
  userId?: string;
  period?: "week" | "month" | "quarter";
}

/**
 * Récupère les statistiques d'analyse du réseau.
 */
export function useNetworkAnalytics({
  userId,
  period = "month",
}: UseNetworkAnalyticsOptions = {}) {
  const { user: firebaseUser } = useFirebaseAuth();
  const isAuthenticated = !!firebaseUser;

  // ✅ Correction : Transtypage explicite de l'ID utilisateur en Id<"users"> pour la conformité Convex
  const data = useQuery(
    api.network.getProfileAnalytics,
    isAuthenticated
      ? {
          userId: (userId || firebaseUser?.uid) as Id<"users">,
          period,
        }
      : "skip",
  );

  return {
    analytics: data as NetworkAnalytics | undefined,
    isLoading: data === undefined,
    isEmpty: data === null,
  };
}
