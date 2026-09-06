// src/features/network/hooks/useNetworkProfile.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { NetworkProfile } from "../types"; // ✅ Correction d'aiguillage d'import [1]

/**
 * Récupère le profil public d'un utilisateur pour la page de détail Network.
 */
export function useNetworkProfile(userId: Id<"users">) {
  const profile = useQuery(api.network.getPublicProfile, { userId });

  return {
    profile: profile as NetworkProfile | undefined | null,
    isLoading: profile === undefined,
    isError: profile === null,
  };
}
