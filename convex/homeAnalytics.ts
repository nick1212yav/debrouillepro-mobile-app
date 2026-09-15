// convex/homeAnalytics.ts

import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================================
// TYPES DE VALIDATION
// ============================================================

const eventTypeValidator = v.union(
  v.literal("section_impression"),
  v.literal("item_impression"),
  v.literal("click"),
  v.literal("like"),
  v.literal("save"),
  v.literal("share"),
  v.literal("comment"),
  v.literal("scroll"),
  v.literal("time_spent"),
  v.literal("search"),
  v.literal("dismiss"),
  v.literal("refresh"),
);

const homeEventValidator = v.object({
  eventType: eventTypeValidator,

  sessionId: v.optional(v.string()),

  sectionId: v.optional(v.string()),

  itemId: v.optional(v.string()),

  itemType: v.optional(v.string()),

  moduleId: v.optional(v.string()),

  position: v.optional(v.number()),

  source: v.optional(v.string()),

  metadata: v.optional(v.record(v.string(), v.any())),
});

// ============================================================
// HELPERS
// ============================================================

/**
 * Retourne l'utilisateur Convex correspondant
 * à l'identité Firebase/Convex actuellement connectée.
 *
 * Architecture actuelle :
 * Firebase Auth
 *      ↓
 * tokenIdentifier
 *      ↓
 * users.by_token
 */
async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity?.tokenIdentifier) {
    return null;
  }

  return await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

/**
 * Normalise une limite de résultats.
 */
function normalizeLimit(
  value: number | undefined,
  fallback: number,
  maximum: number,
) {
  return Math.min(Math.max(value ?? fallback, 1), maximum);
}

// ============================================================
// MUTATION : TRACK EVENT
// ============================================================

/**
 * Enregistre un événement analytique Home.
 *
 * IMPORTANT :
 * Cette mutation ne modifie PAS les publications.
 *
 * Les compteurs métier comme :
 * - likeCount
 * - commentCount
 * - shareCount
 * - viewCount
 *
 * doivent être gérés par leurs propres mutations métier.
 *
 * homeEvents reste uniquement le journal comportemental.
 */
export const trackEvent = mutation({
  args: {
    event: homeEventValidator,
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    await ctx.db.insert("homeEvents", {
      userId: user?._id,

      eventType: args.event.eventType,

      sessionId: args.event.sessionId,

      sectionId: args.event.sectionId,

      itemId: args.event.itemId,

      itemType: args.event.itemType,

      moduleId: args.event.moduleId,

      position: args.event.position,

      source: args.event.source,

      metadata: args.event.metadata,

      timestamp: Date.now(),
    });

    return {
      success: true,
      eventRecorded: true,
    };
  },
});

// ============================================================
// MUTATION : TRACK EVENTS BATCH
// ============================================================

/**
 * Enregistre plusieurs événements Home en une seule mutation.
 *
 * Aucun compteur de publication n'est modifié ici.
 *
 * Cette mutation est destinée notamment à :
 * - impressions
 * - scroll
 * - clicks
 * - recherches
 * - dismiss
 * - refresh
 * - interactions rapides
 */
export const trackEventsBatch = mutation({
  args: {
    events: v.array(homeEventValidator),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (args.events.length === 0) {
      return {
        success: true,
        count: 0,
      };
    }

    const timestamp = Date.now();

    await Promise.all(
      args.events.map((event) =>
        ctx.db.insert("homeEvents", {
          userId: user?._id,

          eventType: event.eventType,

          sessionId: event.sessionId,

          sectionId: event.sectionId,

          itemId: event.itemId,

          itemType: event.itemType,

          moduleId: event.moduleId,

          position: event.position,

          source: event.source,

          metadata: event.metadata,

          timestamp,
        }),
      ),
    );

    return {
      success: true,
      count: args.events.length,
    };
  },
});

// ============================================================
// QUERY : ANALYTICS SUMMARY
// ============================================================

/**
 * Récupère les statistiques comportementales Home
 * d'un utilisateur.
 *
 * Par défaut :
 * - utilisateur actuellement connecté
 * - 30 derniers jours
 * - maximum 1000 événements
 *
 * Cette query alimente notamment :
 *
 * SmartContextSuggestions
 * OpportunityRadar
 * NearbyNow
 * DailyBrief
 * HomeCommandCenter
 * HomePersonalizationSheet
 * HomeActivityPulse
 */
export const getAnalyticsSummary = query({
  args: {
    userId: v.optional(v.id("users")),

    since: v.optional(v.number()),

    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    let targetUserId = args.userId;

    // ----------------------------------------------------------
    // Déterminer l'utilisateur courant
    // ----------------------------------------------------------

    if (!targetUserId && identity?.tokenIdentifier) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      targetUserId = user?._id;
    }

    if (!targetUserId) {
      return null;
    }

    // ----------------------------------------------------------
    // Période
    // ----------------------------------------------------------

    const since = args.since ?? Date.now() - 30 * 24 * 60 * 60 * 1000;

    const limit = normalizeLimit(args.limit, 1000, 5000);

    // ----------------------------------------------------------
    // Récupération des événements
    // ----------------------------------------------------------

    const events = await ctx.db
      .query("homeEvents")
      .withIndex("by_user", (q: any) => q.eq("userId", targetUserId))
      .filter((q: any) => q.gte(q.field("timestamp"), since))
      .order("desc")
      .take(limit);

    // ----------------------------------------------------------
    // Structure d'agrégation
    // ----------------------------------------------------------

    const summary = {
      totalImpressions: 0,

      totalClicks: 0,

      totalLikes: 0,

      totalSaves: 0,

      totalShares: 0,

      totalComments: 0,

      totalSearches: 0,

      totalScrolls: 0,

      totalTimeSpent: 0,

      uniqueSections: new Set<string>(),

      sectionImpressions: {} as Record<string, number>,

      moduleImpressions: {} as Record<string, number>,

      moduleClicks: {} as Record<string, number>,

      moduleEngagement: {} as Record<string, number>,
    };

    // ----------------------------------------------------------
    // Parcours des événements
    // ----------------------------------------------------------

    for (const event of events) {
      switch (event.eventType) {
        // ------------------------------------------------------
        // SECTION IMPRESSION
        // ------------------------------------------------------

        case "section_impression": {
          summary.totalImpressions += 1;

          if (event.sectionId) {
            summary.uniqueSections.add(event.sectionId);

            summary.sectionImpressions[event.sectionId] =
              (summary.sectionImpressions[event.sectionId] ?? 0) + 1;
          }

          break;
        }

        // ------------------------------------------------------
        // ITEM IMPRESSION
        // ------------------------------------------------------

        case "item_impression": {
          summary.totalImpressions += 1;

          if (event.moduleId) {
            summary.moduleImpressions[event.moduleId] =
              (summary.moduleImpressions[event.moduleId] ?? 0) + 1;
          }

          break;
        }

        // ------------------------------------------------------
        // CLICK
        // ------------------------------------------------------

        case "click": {
          summary.totalClicks += 1;

          if (event.moduleId) {
            summary.moduleClicks[event.moduleId] =
              (summary.moduleClicks[event.moduleId] ?? 0) + 1;
          }

          break;
        }

        // ------------------------------------------------------
        // LIKE
        // ------------------------------------------------------

        case "like": {
          summary.totalLikes += 1;
          break;
        }

        // ------------------------------------------------------
        // SAVE
        // ------------------------------------------------------

        case "save": {
          summary.totalSaves += 1;
          break;
        }

        // ------------------------------------------------------
        // SHARE
        // ------------------------------------------------------

        case "share": {
          summary.totalShares += 1;
          break;
        }

        // ------------------------------------------------------
        // COMMENT
        // ------------------------------------------------------

        case "comment": {
          summary.totalComments += 1;
          break;
        }

        // ------------------------------------------------------
        // SEARCH
        // ------------------------------------------------------

        case "search": {
          summary.totalSearches += 1;
          break;
        }

        // ------------------------------------------------------
        // SCROLL
        // ------------------------------------------------------

        case "scroll": {
          summary.totalScrolls += 1;
          break;
        }

        // ------------------------------------------------------
        // TIME SPENT
        // ------------------------------------------------------

        case "time_spent": {
          const seconds = event.metadata?.seconds;

          if (typeof seconds === "number") {
            summary.totalTimeSpent += Math.max(0, seconds);

            if (event.moduleId) {
              summary.moduleEngagement[event.moduleId] =
                (summary.moduleEngagement[event.moduleId] ?? 0) +
                Math.max(0, seconds);
            }
          }

          break;
        }

        // ------------------------------------------------------
        // DISMISS / REFRESH
        // ------------------------------------------------------

        case "dismiss":
        case "refresh": {
          break;
        }
      }
    }

    // ----------------------------------------------------------
    // Résultat sérialisable
    // ----------------------------------------------------------

    return {
      totalImpressions: summary.totalImpressions,

      totalClicks: summary.totalClicks,

      totalLikes: summary.totalLikes,

      totalSaves: summary.totalSaves,

      totalShares: summary.totalShares,

      totalComments: summary.totalComments,

      totalSearches: summary.totalSearches,

      totalScrolls: summary.totalScrolls,

      totalTimeSpent: summary.totalTimeSpent,

      uniqueSections: Array.from(summary.uniqueSections),

      sectionImpressions: summary.sectionImpressions,

      moduleImpressions: summary.moduleImpressions,

      moduleClicks: summary.moduleClicks,

      moduleEngagement: summary.moduleEngagement,

      totalEvents: events.length,

      period: {
        since,

        until: Date.now(),
      },
    };
  },
});

// ============================================================
// QUERY : RECENT EVENTS
// ============================================================

/**
 * Récupère les événements récents
 * de l'utilisateur connecté.
 *
 * Utilisé par :
 * - HomeActivityPulse
 * - HomeCommandCenter
 * - personnalisation
 * - debug
 * - intelligence Home
 */
export const getRecentEvents = query({
  args: {
    limit: v.optional(v.number()),

    eventType: v.optional(eventTypeValidator),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return [];
    }

    const limit = normalizeLimit(args.limit, 50, 200);

    let eventsQuery = ctx.db
      .query("homeEvents")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .order("desc");

    if (args.eventType) {
      eventsQuery = eventsQuery.filter((q: any) =>
        q.eq(q.field("eventType"), args.eventType),
      );
    }

    return await eventsQuery.take(limit);
  },
});

// ============================================================
// ACTION : TRACK EVENT
// ============================================================

/**
 * Action serveur permettant d'enregistrer
 * un événement Home.
 *
 * L'action délègue l'écriture à trackEvent.
 */
export const trackEventAction = action({
  args: {
    event: homeEventValidator,
  },

  handler: async (ctx, args) => {
    await ctx.runMutation(api.homeAnalytics.trackEvent, {
      event: args.event,
    });

    return {
      success: true,
    };
  },
});

// ============================================================
// MUTATION : TRACK TIME SPENT
// ============================================================

/**
 * Enregistre le temps passé dans Home.
 *
 * Les valeurs sont limitées afin d'éviter
 * des données analytiques absurdes.
 */
export const trackTimeSpent = mutation({
  args: {
    seconds: v.number(),

    sessionId: v.optional(v.string()),

    moduleId: v.optional(v.string()),

    sectionId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    if (!user) {
      return {
        success: false,

        reason: "unauthenticated",
      };
    }

    // ----------------------------------------------------------
    // Protection contre les valeurs invalides
    // ----------------------------------------------------------

    const seconds = Math.max(0, Math.min(args.seconds, 24 * 60 * 60));

    // ----------------------------------------------------------
    // Enregistrement
    // ----------------------------------------------------------

    await ctx.db.insert("homeEvents", {
      userId: user._id,

      eventType: "time_spent",

      sessionId: args.sessionId,

      sectionId: args.sectionId,

      moduleId: args.moduleId,

      metadata: {
        seconds,
      },

      timestamp: Date.now(),
    });

    return {
      success: true,

      seconds,
    };
  },
});
