import { UIService } from "@/core/sdk/ui/UIService";

// src/features/network/hooks/useNetworkFollowers.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Follower } from "../components/Network/FollowersList";

interface UseNetworkFollowersOptions {
  userId: Id<"users">;
  limit?: number;
}

/**
 * Gère la liste des abonnés d'un utilisateur.
 */
export function useNetworkFollowers({ userId }: UseNetworkFollowersOptions) {
  // ✅ Correction : Retrait de 'limit' non supporté par la requête getFollowers
  const followers = useQuery(api.follows.getFollowers, { userId });

  // ✅ Correction : Remplacement de 'removeFollower' (inexistante) par 'toggleFollow'
  const toggleFollow = useMutation(api.network.toggleFollow);

  const handleRemoveFollower = async (followerId: Id<"users">) => {
    try {
      if (toggleFollow) {
        await toggleFollow({ targetUserId: followerId });
        UIService.openToast("Abonné retiré", "success");
        return true;
      }
      return false;
    } catch {
      UIService.openToast("Impossible de retirer l'abonné", "error");
      return false;
    }
  };

  return {
    followers: followers as Follower[] | undefined,
    isLoading: followers === undefined,
    isEmpty: followers?.length === 0,
    removeFollower: handleRemoveFollower,
  };
}
