// src/features/marketplace/types/review.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export interface Review {
  _id: Id<"productReviews">;
  productId: Id<"products">;
  orderId: Id<"orders">;
  reviewerId: Id<"users">;
  rating: number;
  comment?: string;
  createdAt: number;
  reviewerName?: string;
  reviewerAvatar?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
}
