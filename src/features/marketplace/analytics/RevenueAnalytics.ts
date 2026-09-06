// src/features/marketplace/analytics/RevenueAnalytics.ts
import type { Order } from "../types/order.types";

export interface RevenueSummary {
  total: number;
  byPeriod: { period: string; revenue: number }[];
  byCategory: { category: string; revenue: number }[];
}

/**
 * Agrège les revenus par période (ex: mois).
 * @param orders - Liste des commandes
 * @param interval - 'month' | 'week' | 'day'
 */
export function revenueByPeriod(
  orders: Order[],
  interval: "month" | "week" | "day" = "month",
): { period: string; revenue: number }[] {
  const map = new Map<string, number>();
  orders.forEach((o) => {
    const date = new Date(o.createdAt);
    let key: string;
    if (interval === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    } else if (interval === "week") {
      const year = date.getFullYear();
      const week = Math.ceil(
        (date.getTime() - new Date(year, 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      );
      key = `${year}-W${String(week).padStart(2, "0")}`;
    } else {
      key = date.toISOString().split("T")[0];
    }
    map.set(key, (map.get(key) || 0) + o.totalAmount);
  });
  return Array.from(map.entries())
    .map(([period, revenue]) => ({ period, revenue }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Agrège les revenus par catégorie de produit.
 */
export function revenueByCategory(
  orders: Order[],
  productCategoryMap: Record<string, string>,
): { category: string; revenue: number }[] {
  const map = new Map<string, number>();
  orders.forEach((o) => {
    const category = productCategoryMap[o.productId] || "Autre";
    map.set(category, (map.get(category) || 0) + o.totalAmount);
  });
  return Array.from(map.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}
