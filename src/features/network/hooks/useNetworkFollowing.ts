import { UIService } from "@/core/sdk/ui/UIService";

// src/features/network/hooks/useNetworkFollowing.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Following } from "../components/Network/FollowingList";

interface UseNetworkFollowingOptions {
  userId: Id<"users">;
  limit?: number;
}

/**
 * Gère la liste des abonnements d'un utilisateur.
 */
export function useNetworkFollowing({ userId }: UseNetworkFollowingOptions) {
  // ✅ Correction : Retrait de 'limit' non supporté par la requête getFollowing
  const following = useQuery(api.follows.getFollowing, { userId });

  // ✅ Correction : Remplacement de 'unfollow' (inexistante) par 'toggleFollow'
  const toggleFollow = useMutation(api.network.toggleFollow);

  const handleUnfollow = async (targetUserId: Id<"users">) => {
    try {
      if (toggleFollow) {
        await toggleFollow({ targetUserId });
        UIService.openToast("Désabonné avec succès", "success");
        return true;
      }
      return false;
    } catch {
      UIService.openToast("Impossible de se désabonner", "error");
      return false;
    }
  };

  return {
    following: following as Following[] | undefined,
    isLoading: following === undefined,
    isEmpty: following?.length === 0,
    unfollow: handleUnfollow,
  };
}
