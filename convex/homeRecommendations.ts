// convex/homeRecommendations.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ============================================================
// VALIDATION
// ============================================================

const recommendationOptionsValidator = v.object({
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
  moduleIds: v.optional(v.array(v.string())),
  types: v.optional(v.array(v.string())),
  excludeViewed: v.optional(v.boolean()),
  minScore: v.optional(v.number()),
});

const recommendationActionValidator = v.union(
  v.literal("view"),
  v.literal("like"),
  v.literal("save"),
  v.literal("share"),
  v.literal("comment"),
  v.literal("click"),
);

// ============================================================
// TYPES
// ============================================================

type RecommendationType =
  | "publication"
  | "module"
  | "service"
  | "event"
  | "job"
  | "property"
  | "product"
  | "user"
  | "community";

type RecommendationItem = {
  id: string;
  type: RecommendationType;
  moduleId: string;
  title: string;
  description: string;
  image: string;
  route: string;
  score: number;
  relevance: "high" | "medium" | "low";
  source: "user_preference" | "trending";
  reason: string;
  createdAt: Date;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  viewed: boolean;
  interacted: boolean;
};

type RecommendationResult = {
  items: RecommendationItem[];
  total: number;
  sessionId: string;
  metadata: {
    engineVersion: string;
    processingTimeMs: number;
    contextUsed: string[];
    viewedCount?: number;
    interactedCount?: number;
    likedCount?: number;
    savedCount?: number;
  };
};

// ============================================================
// CONSTANTES
// ============================================================

const DEFAULT_LIMIT = 20;
const DEFAULT_MIN_SCORE = 10;
const MAX_LIMIT = 50;

const DEFAULT_HOME_PREFERENCES = {
  favoriteModules: [] as string[],
  hiddenSections: [] as string[],
  customSectionOrder: [] as string[],
  notificationPreferences: {
    newRecommendations: true,
    nearbyAlerts: true,
    opportunities: true,
  },
};

// ============================================================
// QUERY PRINCIPALE
// ============================================================

export const getRecommendations = query({
  args: {
    options: v.optional(recommendationOptionsValidator),
  },

  handler: async (ctx, args): Promise<RecommendationResult> => {
    const identity = await ctx.auth.getUserIdentity();

    // ----------------------------------------------------------
    // UTILISATEUR NON CONNECTÉ
    // ----------------------------------------------------------

    if (!identity) {
      return await getGlobalTrends(ctx, args.options);
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return await getGlobalTrends(ctx, args.options);
    }

    // ----------------------------------------------------------
    // PRÉFÉRENCES
    // ----------------------------------------------------------

    const preferences = user.homePreferences ?? DEFAULT_HOME_PREFERENCES;

    const favoriteModules = preferences.favoriteModules ?? [];

    // ----------------------------------------------------------
    // OPTIONS
    // ----------------------------------------------------------

    const limit = Math.min(
      Math.max(args.options?.limit ?? DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );

    const offset = Math.max(args.options?.offset ?? 0, 0);

    const moduleIds = args.options?.moduleIds;
    const types = args.options?.types;

    const excludeViewed = args.options?.excludeViewed ?? true;

    const minScore = args.options?.minScore ?? DEFAULT_MIN_SCORE;

    // ----------------------------------------------------------
    // HISTORIQUE HOME
    // ----------------------------------------------------------

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const homeEvents = await ctx.db
      .query("homeEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("timestamp"), thirtyDaysAgo))
      .collect();

    // ----------------------------------------------------------
    // EXTRAIRE LES INTERACTIONS
    // ----------------------------------------------------------

    const viewedIds = new Set<string>();
    const interactedIds = new Set<string>();
    const likedIds = new Set<string>();
    const savedIds = new Set<string>();

    for (const event of homeEvents) {
      if (!event.itemId) {
        continue;
      }

      if (event.eventType === "item_impression") {
        viewedIds.add(event.itemId);
      }

      if (event.eventType === "click") {
        interactedIds.add(event.itemId);
      }

      if (event.eventType === "like") {
        interactedIds.add(event.itemId);
        likedIds.add(event.itemId);
      }

      if (event.eventType === "save") {
        interactedIds.add(event.itemId);
        savedIds.add(event.itemId);
      }

      if (event.eventType === "share") {
        interactedIds.add(event.itemId);
      }

      if (event.eventType === "comment") {
        interactedIds.add(event.itemId);
      }
    }

    // ----------------------------------------------------------
    // PUBLICATIONS ACTIVES
    //
    // IMPORTANT :
    // On n'utilise pas d'index "by_status".
    // ----------------------------------------------------------

    const publications = await ctx.db
      .query("publications")
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    // ----------------------------------------------------------
    // FILTRAGE
    // ----------------------------------------------------------

    let eligiblePublications = publications;

    if (moduleIds && moduleIds.length > 0) {
      eligiblePublications = eligiblePublications.filter((publication) =>
        moduleIds.includes(publication.type),
      );
    }

    if (types && types.length > 0) {
      eligiblePublications = eligiblePublications.filter((publication) =>
        types.includes(publication.type),
      );
    }

    if (excludeViewed) {
      eligiblePublications = eligiblePublications.filter(
        (publication) => !viewedIds.has(publication._id),
      );
    }

    // ----------------------------------------------------------
    // SCORE
    // ----------------------------------------------------------

    const scoredPublications: Array<{
      publication: (typeof publications)[number];
      score: number;
      reason: string;
    }> = [];

    for (const publication of eligiblePublications) {
      let score = 0;
      let reason = "recommended_for_you";

      // --------------------------------------------------------
      // A. MODULE FAVORI
      // --------------------------------------------------------

      if (favoriteModules.includes(publication.type)) {
        score += 30;
        reason = "based_on_your_interests";
      }

      // --------------------------------------------------------
      // B. INTÉRÊTS UTILISATEUR
      // --------------------------------------------------------

      if (publication.category && user.interests) {
        const categoryMatch = user.interests.some((interest) =>
          publication.category?.toLowerCase().includes(interest.toLowerCase()),
        );

        if (categoryMatch) {
          score += 20;
          reason = "based_on_your_interests";
        }
      }

      // --------------------------------------------------------
      // C. TAGS / INTÉRÊTS
      // --------------------------------------------------------

      if (
        publication.tags.length > 0 &&
        user.interests &&
        user.interests.length > 0
      ) {
        const matches = publication.tags.filter((tag) =>
          user.interests?.some((interest) =>
            tag.toLowerCase().includes(interest.toLowerCase()),
          ),
        ).length;

        if (matches > 0) {
          score += Math.min(matches * 8, 20);
          reason = "based_on_your_interests";
        }
      }

      // --------------------------------------------------------
      // D. PROXIMITÉ
      // --------------------------------------------------------

      if (user.city && publication.location) {
        if (
          publication.location.toLowerCase().includes(user.city.toLowerCase())
        ) {
          score += 20;
          reason = "popular_in_your_area";
        }
      }

      // --------------------------------------------------------
      // E. ENGAGEMENT
      // --------------------------------------------------------

      const views = publication.viewCount ?? 0;
      const likes = publication.likeCount ?? 0;
      const comments = publication.commentCount ?? 0;
      const shares = publication.shareCount ?? 0;

      const engagementScore =
        Math.min(views / 100, 20) +
        Math.min(likes * 2, 25) +
        Math.min(comments * 4, 25) +
        Math.min(shares * 4, 20);

      score += Math.min(engagementScore, 30);

      if (engagementScore >= 20) {
        reason = "trending_now";
      }

      // --------------------------------------------------------
      // F. FRAÎCHEUR
      // --------------------------------------------------------

      const ageHours = Math.max(
        0,
        (Date.now() - publication._creationTime) / (1000 * 60 * 60),
      );

      const freshnessScore = Math.max(0, 20 - ageHours * 0.5);

      score += freshnessScore;

      if (ageHours <= 24) {
        reason = "new_today";
      }

      // --------------------------------------------------------
      // G. PROMOTION / PREMIUM
      // --------------------------------------------------------

      if (publication.isPromoted) {
        score += 10;
        reason = "sponsored";
      }

      if (publication.isPremium) {
        score += 5;
      }

      // --------------------------------------------------------
      // H. NOTE
      // --------------------------------------------------------

      if (typeof publication.avgRating === "number") {
        score += Math.min(publication.avgRating * 2, 10);
      }

      // --------------------------------------------------------
      // I. INTERACTION PERSONNELLE
      // --------------------------------------------------------

      if (interactedIds.has(publication._id)) {
        score -= 5;
      }

      // --------------------------------------------------------
      // SCORE FINAL
      // --------------------------------------------------------

      score = Math.max(0, Math.min(100, score));

      scoredPublications.push({
        publication,
        score,
        reason,
      });
    }

    // ----------------------------------------------------------
    // TRI
    // ----------------------------------------------------------

    scoredPublications.sort((a, b) => b.score - a.score);

    // ----------------------------------------------------------
    // SEUIL
    // ----------------------------------------------------------

    const filtered = scoredPublications.filter(
      (item) => item.score >= minScore,
    );

    // ----------------------------------------------------------
    // PAGINATION
    // ----------------------------------------------------------

    const total = filtered.length;

    const paginated = filtered.slice(offset, offset + limit);

    // ----------------------------------------------------------
    // TRANSFORMATION FRONTEND
    // ----------------------------------------------------------

    const items: RecommendationItem[] = paginated.map((item) => {
      const publication = item.publication;
      const moduleId = publication.type;

      return {
        id: publication._id,

        type: mapPublicationTypeToRecommendationType(publication.type),

        moduleId,

        title: publication.title || "Sans titre",

        description: publication.description || "",

        image: publication.images?.[0] ?? "",

        route: `/${moduleId}/${publication._id}`,

        score: Math.round(item.score),

        relevance:
          item.score >= 70 ? "high" : item.score >= 40 ? "medium" : "low",

        source: favoriteModules.includes(moduleId)
          ? "user_preference"
          : "trending",

        reason: item.reason,

        createdAt: new Date(publication._creationTime),

        metrics: {
          views: publication.viewCount ?? 0,

          likes: publication.likeCount ?? 0,

          comments: publication.commentCount ?? 0,

          shares: publication.shareCount ?? 0,
        },

        viewed: viewedIds.has(publication._id),

        interacted: interactedIds.has(publication._id),
      };
    });

    // ----------------------------------------------------------
    // RETOUR
    // ----------------------------------------------------------

    return {
      items,
      total,

      sessionId: `home-recs-${Date.now()}-${user._id}`,

      metadata: {
        engineVersion: "1.1.0",

        processingTimeMs: 0,

        contextUsed: [
          "user_preferences",
          "city",
          "country",
          "activity_history",
          "publication_metrics",
          "freshness",
          "promotion",
        ],

        viewedCount: viewedIds.size,
        interactedCount: interactedIds.size,
        likedCount: likedIds.size,
        savedCount: savedIds.size,
      },
    };
  },
});

// ============================================================
// TENDANCES GLOBALES
// ============================================================

async function getGlobalTrends(
  ctx: any,
  options?: {
    limit?: number;
    offset?: number;
  },
): Promise<RecommendationResult> {
  const limit = Math.min(
    Math.max(options?.limit ?? DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  const offset = Math.max(options?.offset ?? 0, 0);

  // ----------------------------------------------------------
  // PUBLICATIONS ACTIVES
  // ----------------------------------------------------------

  const publications = await ctx.db
    .query("publications")
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .order("desc")
    .collect();

  // ----------------------------------------------------------
  // SCORE GLOBAL
  // ----------------------------------------------------------

  const scored = publications.map((publication: any) => {
    const views = publication.viewCount ?? 0;

    const likes = publication.likeCount ?? 0;

    const comments = publication.commentCount ?? 0;

    const shares = publication.shareCount ?? 0;

    const ageDays = Math.max(
      0,
      (Date.now() - publication._creationTime) / (1000 * 60 * 60 * 24),
    );

    const popularity =
      Math.min(views / 100, 20) +
      Math.min(likes * 2, 25) +
      Math.min(comments * 4, 25) +
      Math.min(shares * 4, 20);

    const freshness = Math.max(0, 20 - ageDays);

    const promotion = publication.isPromoted ? 10 : 0;

    const score = Math.min(100, popularity + freshness + promotion);

    return {
      publication,
      score,
    };
  });

  // ----------------------------------------------------------
  // TRI
  // ----------------------------------------------------------

  scored.sort((a: any, b: any) => b.score - a.score);

  const paginated = scored.slice(offset, offset + limit);

  // ----------------------------------------------------------
  // TRANSFORMATION
  // ----------------------------------------------------------

  const items: RecommendationItem[] = paginated.map((item: any) => {
    const publication = item.publication;

    const moduleId = publication.type;

    return {
      id: publication._id,

      type: mapPublicationTypeToRecommendationType(publication.type),

      moduleId,

      title: publication.title || "Sans titre",

      description: publication.description || "",

      image: publication.images?.[0] ?? "",

      route: `/${moduleId}/${publication._id}`,

      score: Math.round(item.score),

      relevance:
        item.score >= 70 ? "high" : item.score >= 40 ? "medium" : "low",

      source: "trending",

      reason: "trending_now",

      createdAt: new Date(publication._creationTime),

      metrics: {
        views: publication.viewCount ?? 0,

        likes: publication.likeCount ?? 0,

        comments: publication.commentCount ?? 0,

        shares: publication.shareCount ?? 0,
      },

      viewed: false,
      interacted: false,
    };
  });

  return {
    items,

    total: scored.length,

    sessionId: `global-trends-${Date.now()}`,

    metadata: {
      engineVersion: "1.1.0",

      processingTimeMs: 0,

      contextUsed: ["trending", "engagement", "freshness", "promotion"],
    },
  };
}

// ============================================================
// MAPPING TYPES
// ============================================================

function mapPublicationTypeToRecommendationType(
  type: string,
): RecommendationType {
  const mapping: Record<string, RecommendationType> = {
    job: "job",
    immo: "property",
    service: "service",
    annonce: "product",
    evenement: "event",
    marketplace: "product",
    agri: "product",
    sante: "service",
    transport: "service",
    community: "community",

    video: "publication",
    article: "publication",
    sondage: "publication",

    restauration: "service",
    hebergement: "service",
    energie: "service",

    ong: "community",
    network: "user",
    voyages: "publication",
  };

  return mapping[type] ?? "publication";
}

// ============================================================
// MUTATION : ENREGISTRER UNE INTERACTION
// ============================================================

export const recordRecommendationInteraction = mutation({
  args: {
    itemId: v.string(),

    action: recommendationActionValidator,

    sessionId: v.string(),

    metadata: v.optional(
      v.object({
        position: v.optional(v.number()),
        source: v.optional(v.string()),
        sectionId: v.optional(v.string()),
      }),
    ),
  },

  handler: async (ctx, args) => {
    // --------------------------------------------------------
    // UTILISATEUR
    // --------------------------------------------------------

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        success: false,
        reason: "not_authenticated",
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return {
        success: false,
        reason: "user_not_found",
      };
    }

    // --------------------------------------------------------
    // PUBLICATION
    // --------------------------------------------------------

    let publication: any | null = null;

    try {
      publication = await ctx.db.get(args.itemId as Id<"publications">);
    } catch {
      publication = null;
    }

    // --------------------------------------------------------
    // HOME EVENT
    // --------------------------------------------------------

    const eventType = mapActionToHomeEvent(args.action);

    await ctx.db.insert("homeEvents", {
      userId: user._id,

      eventType,

      sessionId: args.sessionId,

      itemId: args.itemId,

      itemType: publication?.type,

      moduleId: publication?.type,

      position: args.metadata?.position,

      source: args.metadata?.source,

      sectionId: args.metadata?.sectionId,

      timestamp: Date.now(),

      metadata: {
        recommendation: true,
        action: args.action,
      },
    });

    // --------------------------------------------------------
    // MÉTRIQUES
    // --------------------------------------------------------

    if (publication) {
      if (args.action === "view") {
        await ctx.db.patch(publication._id, {
          viewCount: (publication.viewCount ?? 0) + 1,
        });
      }

      if (args.action === "like") {
        await ctx.db.patch(publication._id, {
          likeCount: (publication.likeCount ?? 0) + 1,
        });
      }

      if (args.action === "share") {
        await ctx.db.patch(publication._id, {
          shareCount: (publication.shareCount ?? 0) + 1,
        });
      }

      // ------------------------------------------------------
      // FAVORI
      // ------------------------------------------------------

      if (args.action === "save") {
        const existing = await ctx.db
          .query("publicationFavorites")
          .withIndex("by_user_and_publication", (q) =>
            q.eq("userId", user._id).eq("publicationId", publication._id),
          )
          .first();

        if (!existing) {
          await ctx.db.insert("publicationFavorites", {
            userId: user._id,

            publicationId: publication._id,

            createdAt: Date.now(),
          });
        }
      }
    }

    return {
      success: true,
      itemId: args.itemId,
      action: args.action,
    };
  },
});

// ============================================================
// MAPPING ACTION -> HOME EVENT
// ============================================================

function mapActionToHomeEvent(
  action: "view" | "like" | "save" | "share" | "comment" | "click",
): "item_impression" | "like" | "save" | "share" | "comment" | "click" {
  if (action === "view") {
    return "item_impression";
  }

  return action;
}
