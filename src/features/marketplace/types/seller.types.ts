// src/features/marketplace/types/seller.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export interface Seller {
  userId: Id<"users">;
  name: string;
  avatar?: string;
  verified: boolean;
  rating?: number;
  reviewCount: number;
  totalSales: number;
  responseTime?: string; // ✅ Ajout
  joinDate: number;
  location?: string;
  bio?: string;
  // Champs additionnels
  about?: string;
  guarantees?: string[];
  milestones?: Milestone[];
  certifications?: string[];
  policies?: SellerPolicies;
  badges?: SellerBadge[];
  totalRevenue?: number;
  totalOrders?: number;
  conversionRate?: number;
  fulfillmentRate?: number;
}

export interface SellerPolicies {
  return?: string;
  shipping?: string;
  warranty?: string;
}

export interface SellerBadge {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Milestone {
  date: string;
  title: string;
  description: string;
}
