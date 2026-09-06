import type { ModuleId } from "@/config/modules/moduleRegistry";

/**
 * ============================================================
 * HOME — RECOMMENDATION TYPES
 * ============================================================
 */

export type RelevanceLevel = "very_high" | "high" | "medium" | "low";

/**
 * Raisons possibles d'une recommandation.
 */
export type RecommendationReason =
  | "personalized"
  | "nearby"
  | "recent_activity"
  | "interest"
  | "favorite_module"
  | "trending"
  | "popular"
  | "similar"
  | "opportunity"
  | "continuation"
  | "contextual"
  | "new"
  | "fallback";

/**
 * Élément recommandé.
 *
 * IMPORTANT :
 * `type: "recommendation"` permet aux composants
 * HomeFeed/HomeSection de le distinguer des FeedItem.
 */
export interface RecommendationItem {
  id: string;

  type: "recommendation";

  moduleId?: ModuleId;

  title: string;

  description?: string;

  image?: string;

  imageUrl?: string;

  route: string;

  score: number;

  relevance: RelevanceLevel;

  reason?: RecommendationReason;

  reasonLabel?: string;

  category?: string;

  authorId?: string;

  authorName?: string;

  authorAvatar?: string;

  createdAt?: number | Date;

  updatedAt?: number | Date;

  distanceKm?: number;

  position?: number;

  interacted?: boolean;

  isNew?: boolean;

  isSponsored?: boolean;

  metadata?: Record<string, unknown>;
}

/**
 * Entrée du moteur de recommandation.
 */
export interface RecommendationInput {
  userId?: string;

  moduleId?: ModuleId;

  category?: string;

  title?: string;

  description?: string;

  image?: string;

  route?: string;

  score?: number;

  metadata?: Record<string, unknown>;
}

/**
 * Contexte de génération.
 */
export interface RecommendationContext {
  userId?: string;

  location?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };

  interests?: string[];

  categories?: string[];

  favoriteModules?: ModuleId[];

  recentModules?: ModuleId[];

  recentItems?: string[];

  currentTime?: number | Date;

  metadata?: Record<string, unknown>;
}

/**
 * Options de recommandation.
 */
export interface RecommendationOptions {
  limit?: number;

  moduleIds?: ModuleId[];

  categories?: string[];

  excludeIds?: string[];

  includeNearby?: boolean;

  includeTrending?: boolean;

  includeNew?: boolean;

  personalized?: boolean;

  minimumScore?: number;
}

/**
 * Résultat du moteur de recommandation.
 */
export interface RecommendationResult {
  items: RecommendationItem[];

  generatedAt: Date;

  algorithm?: string;

  totalCandidates?: number;

  personalized: boolean;

  reason?: string;
}
