import { UIService } from "@/core/sdk/ui/UIService";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useServiceReviews(providerId: Id<"serviceProviders">) {
  const reviews = useQuery(api.serviceProviders.getReviews, { providerId });
  const createReview = useMutation(api.serviceProviders.createReview);
  const addReview = async (rating: number, comment: string) => {
    try {
      await createReview({ providerId, rating, comment });
      UIService.openToast("Avis envoyé !", "success");
    } catch {
      UIService.openToast("Erreur lors de l'envoi", "error");
    }
  };
  return { reviews: reviews || [], addReview, loading: reviews === undefined };
}
