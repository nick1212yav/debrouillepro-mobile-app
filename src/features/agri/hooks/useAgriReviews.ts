import { UIService } from "@/core/sdk/ui/UIService";

// src/features/agri/hooks/useAgriReviews.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";

export function useAgriReviews(productId: string) {
  const reviews = useQuery(api.agri.getProductReviews, {
    productId: productId as unknown as Id<"agriProducts">,
  });
  const submitReview = useMutation(api.agri.addReview);

  const handleAddReview = async (
    rating: number,
    comment: string,
    bookingId: string,
  ) => {
    try {
      await submitReview({
        productId: productId as unknown as Id<"agriProducts">,
        rating,
        comment,
        bookingId: bookingId as unknown as Id<"agriBookings">, // ✅ Transmis dynamiquement pour satisfaire le schéma Convex
      });
      UIService.openToast("Votre avis a bien été publié !", "success");
    } catch {
      UIService.openToast("Erreur lors de la publication de l'avis", "error");
    }
  };

  return {
    reviews,
    addReview: handleAddReview,
    isLoading: reviews === undefined,
  };
}
