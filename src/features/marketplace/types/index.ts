// src/features/marketplace/types/index.ts
import type { Id } from "@/convex/_generated/dataModel";

export * from "./product.types";
export * from "./seller.types";
export * from "./cart.types";
export * from "./order.types";
export * from "./review.types";
export * from "./shipping.types";
export * from "./analytics.types";

// Additional types
export interface ProductFormData {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  stock: number;
  unit?: string;
  tags: string[];
  isDigital: boolean;
  deliveryAvailable: boolean;
  location?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug?: string;
  warrantyMonths?: number;
  warrantyCoverage?: string[];
  discountPercent?: number;
  discountStart?: string;
  discountEnd?: string;
  isFeatured?: boolean;
  flashSale?: boolean;
  visible?: boolean;
  allowComments?: boolean;
  allowQuestions?: boolean;
  deliveryAreas?: string[];
  deliveryCost?: number;
  freeDeliveryThreshold?: number;
  expressDelivery?: boolean;
  variants?: { id: string; name: string; options: string[] }[];
  attributes?: Record<string, string>;
}

export interface MarketplaceFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: Id<"users">;
  inStock?: boolean;
  deliveryAvailable?: boolean;
  rating?: number;
  sort?: "recent" | "price_asc" | "price_desc" | "rating" | "popularity";
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  description: string;
  expiresAt?: string;
  minPurchase?: number;
  currency: string;
  currentPrice?: number;
}
