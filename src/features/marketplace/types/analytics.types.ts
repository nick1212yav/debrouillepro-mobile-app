// src/features/marketplace/types/analytics.types.ts
export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDay: { date: string; amount: number; orders: number }[];
  topProducts: {
    id: string;
    name: string;
    revenue: number;
    quantity: number;
  }[];
}

export interface ProductAnalytics {
  productId: string;
  views: number;
  addToCart: number;
  purchases: number;
  conversionRate: number;
  revenue: number;
}

export interface SellerAnalytics {
  sellerId: string;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  responseTime: number;
  followers: number;
}

export interface RevenueAnalytics {
  daily: { date: string; revenue: number }[];
  weekly: { week: string; revenue: number }[];
  monthly: { month: string; revenue: number }[];
  yearly: { year: string; revenue: number }[];
  totalRevenue: number;
  growth: number;
}
