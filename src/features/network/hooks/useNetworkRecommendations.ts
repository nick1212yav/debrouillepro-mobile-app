// src/features/network/hooks/useNetworkRecommendations.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export interface NetworkRecommendation {
  _id: Id<"networkRecommendations">;
  fromUserId: Id<"users">;
  fromName: string;
  fromAvatar?: string;
  receiverId: Id<"users">;
  rating: number;
  comment: string;
  createdAt: string;
}

interface UseNetworkRecommendationsOptions {
  userId: Id<"users">;
}

/**
 * Gère les recommandations reçues par un utilisateur.
 */
export function useNetworkRecommendations({
  userId,
}: UseNetworkRecommendationsOptions) {
  const recommendations = useQuery(api.network.getUserRecommendations, {
    userId,
  });

  const addRecommendation = useMutation(api.network.addRecommendation);
  const deleteRecommendation = useMutation(api.network.deleteRecommendation);

  // ✅ Correction : Rendu conforme en omettant également 'receiverId' des paramètres du formulaire [1]
  const handleAdd = async (
    data: Omit<
      NetworkRecommendation,
      | "_id"
      | "fromUserId"
      | "fromName"
      | "fromAvatar"
      | "createdAt"
      | "receiverId"
    >,
  ) => {
    try {
      const id = await addRecommendation({ receiverId: userId, ...data });
      toast.success("Recommandation envoyée");
      return id;
    } catch {
      toast.error("Erreur lors de l'envoi");
      return null;
    }
  };

  const handleDelete = async (
    recommendationId: Id<"networkRecommendations">,
  ) => {
    try {
      await deleteRecommendation({ id: recommendationId });
      toast.success("Recommandation supprimée");
      return true;
    } catch {
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  return {
    recommendations: recommendations as NetworkRecommendation[] | undefined,
    isLoading: recommendations === undefined,
    isEmpty: recommendations?.length === 0,
    addRecommendation: handleAdd,
    deleteRecommendation: handleDelete,
  };
}
