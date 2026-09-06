// src/features/marketplace/ai/ReviewSummarizer.ts
import type { Review } from "../types/review.types";

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  sentiment: "positive" | "neutral" | "negative";
  keyPoints: string[];
}

/**
 * Résume les avis d'un produit.
 */
export function summarizeReviews(reviews: Review[]): ReviewSummary {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      sentiment: "neutral",
      keyPoints: ["Aucun avis pour le moment."],
    };
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 2).length;
  const sentiment =
    positive > negative
      ? "positive"
      : negative > positive
        ? "negative"
        : "neutral";

  // Extraction de mots-clés (simulé)
  const words = reviews.flatMap((r) => (r.comment || "").split(/\s+/));
  const freq: Record<string, number> = {};
  words.forEach((w) => {
    const lower = w.toLowerCase().replace(/[.,!?;:]/g, "");
    if (lower.length > 3) {
      freq[lower] = (freq[lower] || 0) + 1;
    }
  });
  const keyPoints = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return {
    averageRating: avg,
    totalReviews: reviews.length,
    sentiment,
    keyPoints:
      keyPoints.length > 0 ? keyPoints : ["Aucun mot-clé significatif."],
  };
}
