// src/features/service/hooks/useServiceReviews.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { showToast } from "@/lib/toast";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceReviews(providerId: Id<"serviceProviders">) {
  const reviews = useQuery(api.serviceProviders.getReviews, { providerId });
  const createReview = useMutation(api.serviceProviders.createReview);

  const addReview = async (rating: number, comment: string) => {
    try {
      await createReview({ providerId, rating, comment });
      showToast.success("Avis envoyé !");
    } catch {
      showToast.error("Erreur lors de l'envoi");
    }
  };

  return {
    reviews: reviews || [],
    addReview,
    loading: reviews === undefined,
  };
}
