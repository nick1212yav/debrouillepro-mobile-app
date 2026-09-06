// src/features/marketplace/hooks/useProductReviews.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptReview } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

export function useProductReviews(productId: Id<"products"> | undefined) {
  const reviewsData = useQuery(
    api.commerce.getProductReviews,
    productId ? { productId } : "skip",
  );

  // Stubs (comme avant)
  const addReview = async (rating: number, comment?: string) => {
    console.warn(
      "[useProductReviews] addReview stub",
      productId,
      rating,
      comment,
    );
    await Promise.resolve();
  };

  // ✅ Correction : accepte string, on caste en Id pour la mutation
  const likeReview = async (reviewId: string) => {
    console.warn("[useProductReviews] likeReview stub", reviewId);
    await Promise.resolve();
    // Dans le futur : await likeReviewMutation({ reviewId: reviewId as Id<"productReviews"> });
  };

  const reviews = (reviewsData ?? []).map(adaptReview);

  return {
    reviews,
    addReview,
    likeReview,
    isLoading: reviewsData === undefined,
  };
}
