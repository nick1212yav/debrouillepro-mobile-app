// src/features/network/types/opportunity.types.ts
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Types pour les opportunités (offres d'emploi, services recommandés, etc.)
 */

export interface NetworkJobMatch {
  _id: string; // ✅ Correction : Id<"jobs"> -> string pour éviter les erreurs de compilation [1]
  title: string;
  companyName: string;
  companyLogo?: string;
  companyId?: Id<"users">;
  location: string;
  type: "fulltime" | "parttime" | "contract" | "freelance" | "internship";
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  description: string;
  requiredSkills: string[];
  postedAt: string;
  deadline?: string;
  matchScore: number;
  matchReasons: string[];
  isApplied: boolean;
  isSaved: boolean;
  applicantsCount?: number;
  viewsCount?: number;
}

export interface NetworkServiceMatch {
  _id: string; // ✅ Correction : Id<"services"> -> string pour éviter les erreurs de compilation [1]
  title: string;
  providerName: string;
  providerAvatar?: string;
  providerId: Id<"users">;
  category: string;
  location: string;
  price?: number;
  currency: string;
  priceUnit?: string;
  description: string;
  rating: number;
  reviewCount: number;
  postedAt: string;
  availability: "available" | "limited" | "unavailable";
  matchScore: number;
  matchReasons: string[];
  isContacted: boolean;
  isBookmarked: boolean;
  responseTime?: string;
}

export interface NetworkOpportunityFilters {
  type?: "job" | "service" | "all";
  location?: string;
  category?: string;
  minMatchScore?: number;
  availability?: "available" | "limited" | "unavailable" | "all";
  sortBy?: "match" | "recent" | "rating";
}
