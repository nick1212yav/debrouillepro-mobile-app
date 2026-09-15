// src/features/network/hooks/useNetworkFollowing.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Following } from "../components/Network/FollowingList";
import { toast } from "sonner";

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
        toast.success("Désabonné avec succès");
        return true;
      }
      return false;
    } catch {
      toast.error("Impossible de se désabonner");
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
