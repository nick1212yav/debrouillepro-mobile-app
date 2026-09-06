import type { ReviewRecord, ReviewStats } from "../types/review.types";
import { ReviewValidator } from "../validators/review.validator";

export class ReviewService {
  private static reviews: ReviewRecord[] = [];

  public static async submitReview(data: {
    restaurantId: number;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
  }) {
    const validation = ReviewValidator.validate(data);
    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const review: ReviewRecord = {
      id: `REV-${Math.floor(1000 + Math.random() * 9000)}`,
      restaurantId: data.restaurantId,
      userId: data.userId,
      userName: data.userName,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString(),
    };

    this.reviews.push(review);
    return { success: true, review };
  }

  public static async getRestaurantStats(
    restaurantId: number,
  ): Promise<ReviewStats> {
    const matched = this.reviews.filter((r) => r.restaurantId === restaurantId);

    const stats: ReviewStats = {
      averageRating: 0,
      totalReviews: matched.length,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };

    if (matched.length === 0) return stats;

    let sum = 0;
    matched.forEach((r) => {
      sum += r.rating;
      const key = r.rating as 1 | 2 | 3 | 4 | 5;
      if (stats.ratingDistribution[key] !== undefined) {
        stats.ratingDistribution[key]++;
      }
    });

    stats.averageRating = Number((sum / matched.length).toFixed(1));
    return stats;
  }
}
