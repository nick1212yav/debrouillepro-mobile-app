// src/features/marketplace/analytics/SalesAnalytics.ts
import type { Order } from "../types/order.types";

export interface SalesPeriod {
  start: Date;
  end: Date;
}

export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  topProducts: Array<{ productId: string; quantity: number; revenue: number }>;
}

/**
 * Calcule le résumé des ventes pour une liste de commandes.
 */
export function computeSalesSummary(
  orders: Order[],
  period?: SalesPeriod,
): SalesSummary {
  const filtered = period
    ? orders.filter(
        (o) =>
          o.createdAt >= period.start.getTime() &&
          o.createdAt <= period.end.getTime(),
      )
    : orders;

  const totalRevenue = filtered.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = filtered.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = filtered.reduce((sum, o) => sum + o.quantity, 0);

  // Top produits
  const productMap = new Map<string, { quantity: number; revenue: number }>();
  filtered.forEach((o) => {
    const pid = o.productId;
    const existing = productMap.get(pid);
    if (existing) {
      existing.quantity += o.quantity;
      existing.revenue += o.totalAmount;
    } else {
      productMap.set(pid, { quantity: o.quantity, revenue: o.totalAmount });
    }
  });
  const topProducts = Array.from(productMap.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalItemsSold,
    topProducts,
  };
}

/**
 * Calcule la tendance des ventes par jour.
 * Renvoie un tableau d'objets { date, count, revenue }.
 */
export function salesTrend(
  orders: Order[],
  days: number = 7,
): Array<{ date: string; count: number; revenue: number }> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const map = new Map<string, { count: number; revenue: number }>();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    map.set(key, { count: 0, revenue: 0 });
  }
  orders.forEach((o) => {
    const dateObj = new Date(o.createdAt);
    const key = dateObj.toISOString().split("T")[0];
    const entry = map.get(key);
    if (entry) {
      entry.count += 1;
      entry.revenue += o.totalAmount;
    }
  });
  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    revenue: data.revenue,
  }));
}
