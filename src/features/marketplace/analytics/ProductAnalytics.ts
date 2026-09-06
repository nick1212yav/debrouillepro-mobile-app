// src/features/marketplace/analytics/ProductAnalytics.ts
import type { Product } from "../types/product.types";
import type { Order } from "../types/order.types";

export interface ProductPerformance {
  productId: string;
  title: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number; // sales / views
}

/**
 * Calcule les performances d'un produit (ou de tous les produits).
 * Nécessite des données de vues (à fournir séparément) et les commandes.
 */
export function computeProductPerformance(
  products: Product[],
  orders: Order[],
  viewCounts: Record<string, number>,
): ProductPerformance[] {
  const salesMap = new Map<string, { sales: number; revenue: number }>();
  orders.forEach((o) => {
    const pid = o.productId;
    const existing = salesMap.get(pid);
    if (existing) {
      existing.sales += o.quantity;
      existing.revenue += o.totalAmount;
    } else {
      salesMap.set(pid, { sales: o.quantity, revenue: o.totalAmount });
    }
  });

  return products.map((p) => {
    const salesData = salesMap.get(p._id) || { sales: 0, revenue: 0 };
    const views = viewCounts[p._id] || 0;
    const conversionRate = views > 0 ? salesData.sales / views : 0;
    return {
      productId: p._id,
      title: p.title,
      views,
      sales: salesData.sales,
      revenue: salesData.revenue,
      conversionRate,
    };
  });
}

/**
 * Identifie les produits les plus performants.
 */
export function topPerformingProducts(
  performance: ProductPerformance[],
  limit: number = 5,
): ProductPerformance[] {
  return [...performance].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

/**
 * Identifie les produits à faible rotation.
 */
export function lowTurnoverProducts(
  products: Product[],
  orders: Order[],
  thresholdDays: number = 30,
): Product[] {
  const now = Date.now();
  const cutoff = now - thresholdDays * 24 * 60 * 60 * 1000;
  const soldProductIds = new Set(
    orders.filter((o) => o.createdAt >= cutoff).map((o) => o.productId),
  );
  return products.filter((p) => !soldProductIds.has(p._id) && p.stock > 0);
}
