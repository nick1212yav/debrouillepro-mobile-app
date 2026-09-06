// src/features/marketplace/types/product.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export type ProductStatus = "active" | "out_of_stock" | "archived";

export interface Product {
  _id: Id<"products">;
  sellerId: Id<"users">;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  stock: number;
  unit?: string;
  tags: string[];
  status: ProductStatus;
  isDigital: boolean;
  deliveryAvailable: boolean;
  location?: string;
  latitude?: number;
  longitude?: number;
  rating?: number; // ✅ Ajout
  reviewCount: number; // ✅ Ajout
  createdAt: number;
  updatedAt: number;
  // Enriched
  sellerName?: string;
  sellerAvatar?: string;
  sellerVerified?: boolean;
  isLiked?: boolean;
  isInCart?: boolean;
  // Champs additionnels utilisés
  discountPercent?: number;
  discountEndDate?: string;
  coupons?: Coupon[];
  variants?: Record<string, unknown>[];
  specifications?: Specification[];
  documents?: Document[];
  warrantyMonths?: number;
  warrantyCoverage?: string[];
  isAuthentic?: boolean;
  certificateUrl?: string;
  deliveryDays?: number;
  paymentMethods?: string[];
  threeSixtyImages?: string[];
  arModelUrl?: string;
  stories?: Story[];
  reels?: Reel[];
  bundleProducts?: Product[];
  accessories?: Accessory[];
  similarProducts?: Product[];
  customers?: Customer[];
  shareCount?: number;
  ratingDistribution?: Record<number, number>;
  videoReviews?: VideoReview[];
  liveChat?: string;
  loyaltyPoints?: number;
  loyaltyLevel?: string;
  rewardPoints?: number;
  cashback?: number;
  countdownOffer?: CountdownOffer;
  sellerProducts?: Product[];
  deliveryTracking?: string;
  deliveryTimeline?: TimelineEvent[];
}

export interface Variant {
  id: string;
  name: string;
  options: string[];
}

export interface Specification {
  label: string;
  value: string;
}

export interface Document {
  id: string;
  title: string;
  url: string;
  type: "pdf" | "image" | "other";
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

export interface Story {
  id: string;
  mediaUrl: string;
  duration: number;
}

export interface Reel {
  id: string;
  videoUrl: string;
  thumbnail: string;
  title: string;
}

export interface Accessory {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
}

export interface VideoReview {
  id: string;
  thumbnail: string;
  duration: number;
  reviewerName: string;
}

export interface CountdownOffer {
  endDate: string;
  remaining: number;
}

export interface TimelineEvent {
  id: string;
  status: string;
  location: string;
  date: string;
  description: string;
  isCompleted: boolean;
}
