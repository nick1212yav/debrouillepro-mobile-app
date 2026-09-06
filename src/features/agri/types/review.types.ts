// src/features/agri/types/review.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export interface AgriReview {
  _id: Id<"agriReviews">;
  _creationTime: number;
  productId: Id<"agriProducts">;
  userId: string;
  authorName: string;
  rating: number; // Intervalle de notation de 1 à 5
  comment: string;
}
