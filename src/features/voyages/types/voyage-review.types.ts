// src/features/voyages/types/voyage-review.types.ts
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Avis individuel sur un voyage ou un opérateur
 */
export interface VoyageReview {
  _id: Id<"tripReviews">; // à créer dans Convex plus tard
  tripId: Id<"trips">;
  userId: Id<"users">;
  rating: number;
  title?: string;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  updatedAt?: string;
  // Infos utilisateur (dénormalisées)
  userName?: string;
  userAvatar?: string;
}

/**
 * Statistiques des avis
 */
export interface VoyageReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

/**
 * Formulaire pour ajouter un avis
 */
export interface VoyageReviewFormData {
  rating: number;
  title?: string;
  comment: string;
  tripId: Id<"trips">;
}

/**
 * Réponse du backend pour un avis ajouté
 */
export interface VoyageReviewResponse {
  success: boolean;
  reviewId?: Id<"tripReviews">;
  error?: string;
}
