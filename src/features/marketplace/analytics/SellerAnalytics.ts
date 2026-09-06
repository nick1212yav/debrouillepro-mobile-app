// src/features/marketplace/analytics/SellerAnalytics.ts
import type { Order } from "../types/order.types";
import type { Product } from "../types/product.types";
import type { Review } from "../types/review.types";

export interface SellerMetrics {
  sellerId: string;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  responseRate: number; // % de réponses aux messages
}

/**
 * Calcule les métriques d'un vendeur à partir de ses commandes, produits et avis.
 */
export function computeSellerMetrics(
  sellerId: string,
  products: Product[],
  orders: Order[],
  reviews: Review[],
  responseRate: number = 1.0, // simulé
): SellerMetrics {
  const sellerProducts = products.filter((p) => p.sellerId === sellerId);
  const activeProducts = sellerProducts.filter(
    (p) => p.status === "active",
  ).length;
  const sellerOrders = orders.filter((o) => o.sellerId === sellerId);
  const totalRevenue = sellerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = sellerOrders.length;
  const sellerReviews = reviews.filter(
    (r) => r.productId && sellerProducts.some((p) => p._id === r.productId),
  );
  const avgRating =
    sellerReviews.length > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) /
        sellerReviews.length
      : 0;

  return {
    sellerId,
    totalProducts: sellerProducts.length,
    activeProducts,
    totalOrders,
    totalRevenue,
    averageRating: avgRating,
    reviewCount: sellerReviews.length,
    responseRate,
  };
}
