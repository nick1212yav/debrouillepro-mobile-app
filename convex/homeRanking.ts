// convex/homeRanking.ts

import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================================
// TYPES / VALIDATION CONVEX
// ============================================================

const rankingItemValidator = v.object({
  id: v.string(),

  moduleId: v.optional(v.string()),

  type: v.union(
    v.literal("publication"),
    v.literal("module"),
    v.literal("service"),
    v.literal("event"),
    v.literal("job"),
    v.literal("property"),
    v.literal("product"),
    v.literal("user"),
    v.literal("community"),
  ),

  createdAt: v.number(),

  metrics: v.object({
    views: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    saves: v.number(),
  }),

  location: v.optional(
    v.object({
      latitude: v.number(),
      longitude: v.number(),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
    }),
  ),

  tags: v.optional(v.array(v.string())),

  isPromoted: v.optional(v.boolean()),

  urgencyScore: v.optional(v.number()),

  qualityScore: v.optional(v.number()),
});

const rankingConfigValidator = v.object({
  weights: v.object({
    relevance: v.number(),
    freshness: v.number(),
    proximity: v.number(),
    engagement: v.number(),
    social: v.number(),
    urgency: v.number(),
    quality: v.number(),
    promotion: v.number(),
  }),

  timeDecayHalfLife: v.number(),

  maxProximityDistance: v.number(),

  promotionBonus: v.number(),

  minScoreToDisplay: v.number(),
});

// ============================================================
// TYPES INTERNES
// ============================================================

type RankingWeights = {
  relevance: number;
  freshness: number;
  proximity: number;
  engagement: number;
  social: number;
  urgency: number;
  quality: number;
  promotion: number;
};

type RankingBreakdown = {
  relevance: number;
  freshness: number;
  proximity: number;
  engagement: number;
  social: number;
  urgency: number;
  quality: number;
  promotion: number;
};

type RankingContext = {
  userId?: string;

  location?: {
    latitude: number;
    longitude: number;
  };

  time: {
    hour: number;
    dayOfWeek: number;
    period: "morning" | "afternoon" | "evening" | "night";
    timestamp: number;
  };

  preferences: {
    modules: string[];
    categories: string[];
    interests: string[];
  };

  activity: {
    recentModules: string[];
    recentSearches: string[];
    recentPublications: string[];
    recentInteractions: {
      type: "like" | "save" | "share" | "comment" | "view";
      publicationId: string;
      timestamp: number;
    }[];
    moduleEngagement: Record<string, number>;
  };

  unread: {
    messages: number;
    notifications: number;
    feed: number;
  };

  network: {
    following: number;
    followers: number;
    communities: string[];
  };
};

type RankingItem = {
  id: string;
  moduleId?: string;
  type:
    | "publication"
    | "module"
    | "service"
    | "event"
    | "job"
    | "property"
    | "product"
    | "user"
    | "community";

  createdAt: number;

  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };

  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };

  tags?: string[];

  isPromoted?: boolean;
  urgencyScore?: number;
  qualityScore?: number;
};

type RankingResult = {
  id: string;
  moduleId?: string;
  type: RankingItem["type"];
  finalScore: number;
  breakdown: RankingBreakdown;
  topReason: string;
};

type RankingConfig = {
  weights: RankingWeights;
  timeDecayHalfLife: number;
  maxProximityDistance: number;
  promotionBonus: number;
  minScoreToDisplay: number;
};

// ============================================================
// QUERY PRINCIPALE
// ============================================================

/**
 * Classe les éléments selon le contexte de l'utilisateur.
 */
export const rankItems = query({
  args: {
    items: v.array(rankingItemValidator),

    context: v.object({
      userId: v.optional(v.string()),

      location: v.optional(
        v.object({
          latitude: v.number(),
          longitude: v.number(),
        }),
      ),

      time: v.object({
        hour: v.number(),
        dayOfWeek: v.number(),

        period: v.union(
          v.literal("morning"),
          v.literal("afternoon"),
          v.literal("evening"),
          v.literal("night"),
        ),

        timestamp: v.number(),
      }),

      preferences: v.object({
        modules: v.array(v.string()),
        categories: v.array(v.string()),
        interests: v.array(v.string()),
      }),

      activity: v.object({
        recentModules: v.array(v.string()),

        recentSearches: v.array(v.string()),

        recentPublications: v.array(v.string()),

        recentInteractions: v.array(
          v.object({
            type: v.union(
              v.literal("like"),
              v.literal("save"),
              v.literal("share"),
              v.literal("comment"),
              v.literal("view"),
            ),

            publicationId: v.string(),

            timestamp: v.number(),
          }),
        ),

        moduleEngagement: v.record(v.string(), v.number()),
      }),

      unread: v.object({
        messages: v.number(),
        notifications: v.number(),
        feed: v.number(),
      }),

      network: v.object({
        following: v.number(),
        followers: v.number(),
        communities: v.array(v.string()),
      }),
    }),

    config: v.optional(rankingConfigValidator),
  },

  handler: async (
    _ctx,
    args,
  ): Promise<{
    rankedItems: RankingResult[];
    configUsed: RankingConfig;
    processingTimeMs: number;
  }> => {
    const startTime = Date.now();

    const items: RankingItem[] = args.items;
    const context: RankingContext = args.context;

    const customConfig = args.config;

    // ----------------------------------------------------------
    // CONFIGURATION PAR DÉFAUT
    // ----------------------------------------------------------

    const defaultConfig: RankingConfig = {
      weights: {
        relevance: 0.25,
        freshness: 0.2,
        proximity: 0.15,
        engagement: 0.15,
        social: 0.1,
        urgency: 0.05,
        quality: 0.05,
        promotion: 0.05,
      },

      timeDecayHalfLife: 48,

      maxProximityDistance: 50,

      promotionBonus: 10,

      minScoreToDisplay: 5,
    };

    const config: RankingConfig = customConfig ?? defaultConfig;

    // ----------------------------------------------------------
    // AJUSTEMENT SELON LE MOMENT DE LA JOURNÉE
    // ----------------------------------------------------------

    const timeAdjustments = getTimeWeightAdjustments(context.time.period);

    const weights: RankingWeights = {
      ...config.weights,
    };

    for (const key of Object.keys(weights) as Array<keyof RankingWeights>) {
      const adjustment = timeAdjustments[key];

      if (adjustment !== undefined) {
        weights[key] *= adjustment;
      }
    }

    // ----------------------------------------------------------
    // NORMALISATION DES POIDS
    // ----------------------------------------------------------

    const totalWeight = Object.values(weights).reduce(
      (sum, value) => sum + value,
      0,
    );

    if (totalWeight > 0) {
      for (const key of Object.keys(weights) as Array<keyof RankingWeights>) {
        weights[key] /= totalWeight;
      }
    }

    // ----------------------------------------------------------
    // INTERACTIONS UTILISATEUR
    // ----------------------------------------------------------

    const userInteractedPublicationIds = new Set<string>();

    for (const interaction of context.activity.recentInteractions) {
      userInteractedPublicationIds.add(interaction.publicationId);
    }

    // ----------------------------------------------------------
    // CALCUL DES SCORES
    // ----------------------------------------------------------

    const results: RankingResult[] = items.map(
      (item: RankingItem): RankingResult => {
        const relevanceScore = computeRelevanceScore(item, context);

        const freshnessScore = computeFreshnessScore(
          item,
          config.timeDecayHalfLife,
        );

        const proximityScore = computeProximityScore(
          item,
          context.location,
          config.maxProximityDistance,
        );

        const engagementScore = computeEngagementScore(item);

        const socialScore = computeSocialScore(
          item,
          context,
          userInteractedPublicationIds,
        );

        const urgencyScore = computeUrgencyScore(item);

        const qualityScore = clamp(item.qualityScore ?? 50, 0, 100);

        const promotionScore = item.isPromoted ? config.promotionBonus : 0;

        // --------------------------------------------------------
        // SCORE FINAL
        // --------------------------------------------------------

        const finalScore =
          weights.relevance * relevanceScore +
          weights.freshness * freshnessScore +
          weights.proximity * proximityScore +
          weights.engagement * engagementScore +
          weights.social * socialScore +
          weights.urgency * urgencyScore +
          weights.quality * qualityScore +
          weights.promotion * promotionScore;

        const roundedScore = Math.round(clamp(finalScore, 0, 100));

        const breakdown: RankingBreakdown = {
          relevance: Math.round(relevanceScore),
          freshness: Math.round(freshnessScore),
          proximity: Math.round(proximityScore),
          engagement: Math.round(engagementScore),
          social: Math.round(socialScore),
          urgency: Math.round(urgencyScore),
          quality: Math.round(qualityScore),
          promotion: Math.round(promotionScore),
        };

        return {
          id: item.id,
          moduleId: item.moduleId,
          type: item.type,
          finalScore: roundedScore,
          breakdown,
          topReason: getTopReason(breakdown),
        };
      },
    );

    // ----------------------------------------------------------
    // FILTRE MINIMUM
    // ----------------------------------------------------------

    const filtered: RankingResult[] = results.filter(
      (result: RankingResult) => result.finalScore >= config.minScoreToDisplay,
    );

    // ----------------------------------------------------------
    // TRI
    // ----------------------------------------------------------

    filtered.sort(
      (a: RankingResult, b: RankingResult) => b.finalScore - a.finalScore,
    );

    // ----------------------------------------------------------
    // RETOUR
    // ----------------------------------------------------------

    return {
      rankedItems: filtered,

      configUsed: {
        ...config,
        weights,
      },

      processingTimeMs: Date.now() - startTime,
    };
  },
});

// ============================================================
// SCORE DE PERTINENCE
// ============================================================

function computeRelevanceScore(
  item: RankingItem,
  context: RankingContext,
): number {
  let score = 0;

  // Module favori
  if (item.moduleId && context.preferences.modules.includes(item.moduleId)) {
    score += 30;
  }

  // Tags correspondant aux intérêts
  if (Array.isArray(item.tags) && context.preferences.interests.length > 0) {
    const matchCount = item.tags.filter((tag: string) =>
      context.preferences.interests.some((interest: string) =>
        tag.toLowerCase().includes(interest.toLowerCase()),
      ),
    ).length;

    score += Math.min(matchCount * 10, 30);
  }

  // Module récemment consulté
  if (item.moduleId && context.activity.recentModules.includes(item.moduleId)) {
    score += 20;
  }

  return clamp(score, 0, 100);
}

// ============================================================
// SCORE DE FRAÎCHEUR
// ============================================================

function computeFreshnessScore(
  item: RankingItem,
  halfLifeHours: number,
): number {
  const ageHours = Math.max(
    0,
    (Date.now() - item.createdAt) / (1000 * 60 * 60),
  );

  if (halfLifeHours <= 0) {
    return 0;
  }

  const decay = Math.exp((-Math.LN2 * ageHours) / halfLifeHours);

  return Math.round(clamp(100 * decay, 0, 100));
}

// ============================================================
// SCORE DE PROXIMITÉ
// ============================================================

function computeProximityScore(
  item: RankingItem,
  userLocation:
    | {
        latitude: number;
        longitude: number;
      }
    | undefined,
  maxDistanceKm: number,
): number {
  if (!userLocation || !item.location || maxDistanceKm <= 0) {
    return 0;
  }

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    item.location.latitude,
    item.location.longitude,
  );

  if (distance > maxDistanceKm) {
    return 0;
  }

  const score = 100 * (1 - distance / maxDistanceKm);

  return Math.round(clamp(score, 0, 100));
}

// ============================================================
// SCORE D'ENGAGEMENT
// ============================================================

function computeEngagementScore(item: RankingItem): number {
  const { views, likes, comments, shares, saves } = item.metrics;

  const score =
    Math.min(views / 100, 20) +
    Math.min(likes * 2, 30) +
    Math.min(comments * 5, 30) +
    Math.min(shares * 4, 20) +
    Math.min(saves * 3, 20);

  return Math.round(clamp(score, 0, 100));
}

// ============================================================
// SCORE SOCIAL
// ============================================================

function computeSocialScore(
  item: RankingItem,
  context: RankingContext,
  userInteractedIds: Set<string>,
): number {
  // Interaction directe avec le contenu
  if (userInteractedIds.has(item.id)) {
    return 100;
  }

  // Engagement global du module
  if (item.moduleId) {
    const moduleEngagement = context.activity.moduleEngagement?.[item.moduleId];

    if (typeof moduleEngagement === "number") {
      return Math.round(clamp(moduleEngagement, 0, 100));
    }
  }

  return 0;
}

// ============================================================
// SCORE D'URGENCE
// ============================================================

function computeUrgencyScore(item: RankingItem): number {
  if (typeof item.urgencyScore === "number") {
    return Math.round(clamp(item.urgencyScore, 0, 100));
  }

  return 0;
}

// ============================================================
// RAISON PRINCIPALE
// ============================================================

function getTopReason(breakdown: RankingBreakdown): string {
  const entries: {
    key: string;
    value: number;
    reason: string;
  }[] = [
    {
      key: "relevance",
      value: breakdown.relevance,
      reason: "based_on_your_interests",
    },
    {
      key: "freshness",
      value: breakdown.freshness,
      reason: "new_today",
    },
    {
      key: "proximity",
      value: breakdown.proximity,
      reason: "popular_in_your_area",
    },
    {
      key: "engagement",
      value: breakdown.engagement,
      reason: "trending_now",
    },
    {
      key: "social",
      value: breakdown.social,
      reason: "from_your_network",
    },
    {
      key: "urgency",
      value: breakdown.urgency,
      reason: "urgent",
    },
    {
      key: "quality",
      value: breakdown.quality,
      reason: "recommended_for_you",
    },
    {
      key: "promotion",
      value: breakdown.promotion,
      reason: "sponsored",
    },
  ];

  entries.sort((a, b) => b.value - a.value);

  return entries[0]?.reason ?? "recommended_for_you";
}

// ============================================================
// DISTANCE HAVERSINE
// ============================================================

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ============================================================
// AJUSTEMENT TEMPOREL
// ============================================================

function getTimeWeightAdjustments(period: string): RankingWeights {
  const adjustments: Record<string, RankingWeights> = {
    morning: {
      relevance: 1.2,
      freshness: 1.1,
      proximity: 1.0,
      engagement: 1.0,
      social: 1.0,
      urgency: 1.3,
      quality: 1.0,
      promotion: 1.0,
    },

    afternoon: {
      relevance: 1.0,
      freshness: 1.0,
      proximity: 1.2,
      engagement: 1.0,
      social: 1.0,
      urgency: 1.0,
      quality: 1.0,
      promotion: 1.0,
    },

    evening: {
      relevance: 1.0,
      freshness: 1.0,
      proximity: 1.0,
      engagement: 1.2,
      social: 1.3,
      urgency: 0.8,
      quality: 1.0,
      promotion: 1.0,
    },

    night: {
      relevance: 1.0,
      freshness: 0.9,
      proximity: 1.0,
      engagement: 1.1,
      social: 1.1,
      urgency: 0.7,
      quality: 1.4,
      promotion: 1.0,
    },
  };

  return adjustments[period] ?? adjustments.morning;
}

// ============================================================
// UTILITAIRE CLAMP
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ============================================================
// BATCH RANKING
// ============================================================

export const batchRankItems = action({
  args: {
    items: v.array(rankingItemValidator),

    context: v.any(),

    config: v.optional(rankingConfigValidator),
  },

  handler: async (
    ctx,
    args,
  ): Promise<{
    rankedItems: RankingResult[];
    configUsed: RankingConfig;
    processingTimeMs: number;
  }> => {
    const result: {
      rankedItems: RankingResult[];
      configUsed: RankingConfig;
      processingTimeMs: number;
    } = await ctx.runQuery(api.homeRanking.rankItems, {
      items: args.items,
      context: args.context,
      config: args.config,
    });

    return result;
  },
});
