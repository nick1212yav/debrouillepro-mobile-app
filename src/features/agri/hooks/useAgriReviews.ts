// src/features/agri/hooks/useAgriReviews.ts
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

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
      toast.success("Votre avis a bien été publié !");
    } catch {
      toast.error("Erreur lors de la publication de l'avis");
    }
  };

  return {
    reviews,
    addReview: handleAddReview,
    isLoading: reviews === undefined,
  };
}
