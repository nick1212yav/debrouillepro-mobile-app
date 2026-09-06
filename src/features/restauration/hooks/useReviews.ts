import { useState, useCallback } from "react";
import { ReviewService } from "../services/ReviewService";
import type { ReviewStats } from "../types/review.types";

export function useReviews(restaurantId?: number) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);

  const postReview = useCallback(
    async (data: {
      restaurantId: number;
      userId: string;
      userName: string;
      rating: number;
      comment: string;
    }) => {
      setIsProcessing(true);
      try {
        const response = await ReviewService.submitReview(data);
        if (response.success && restaurantId) {
          // Recalcul immédiat des statistiques réactives
          const updatedStats =
            await ReviewService.getRestaurantStats(restaurantId);
          setStats(updatedStats);
        }
        return response;
      } finally {
        setIsProcessing(false);
      }
    },
    [restaurantId],
  );

  const loadStats = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const updatedStats = await ReviewService.getRestaurantStats(restaurantId);
      setStats(updatedStats);
    } catch (err) {
      console.error("[useReviews] Erreur de chargement des notes :", err);
    }
  }, [restaurantId]);

  return { postReview, loadStats, stats, isProcessing };
}
