// convex/services/stats.ts
//
// Backend Services V1 — statistiques.
//
// Sources de vérité :
//   - provider.viewCount (tracked views)
//   - serviceBookings (status, totalAmount, currency)
//   - serviceQuotes (status, respondedAt)
//   - serviceReviews (rating, visible)
//
// RÈGLE MULTI-DEVISES : aucun total inter-devises. Les montants sont
// toujours groupés par devise. La sélection d'une "devise dominante"
// par comparaison numérique est INTERDITE (100k CDF ≠ 100k USD).
//
// MÉTRIQUES DÉRIVÉES : toute métrique calculée (ratios, moyennes) est
// explicitement marquée comme approximation quand elle n'a pas de
// signification causale stricte.
//
// TODO (dette documentée) : getPlatformStats charge toutes les tables
// en mémoire. Acceptable en dev/preprod. À remplacer par agrégats
// incrémentaux ou pagination lors du passage à l'échelle.

import { query, mutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

// ────────────────────────────────────────────────────────────────
// AUTH
// ────────────────────────────────────────────────────────────────

async function getUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}

async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await getUser(ctx);
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }
  return user;
}

async function requireAdmin(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  const isAdmin = user.isAdmin === true || user.roles?.includes("admin");
  if (!isAdmin) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Réservé aux administrateurs.",
    });
  }
  return user;
}

async function requireOwnedProvider(
  ctx: Ctx,
  providerId: Id<"serviceProviders">,
): Promise<Doc<"serviceProviders">> {
  const user = await requireUser(ctx);
  const provider = await ctx.db.get(providerId);
  if (!provider) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Prestataire introuvable",
    });
  }
  if (provider.userId !== user._id) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas le propriétaire de ce profil.",
    });
  }
  return provider;
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

type CurrencyTotals = Record<string, number>;

function addToCurrency(
  totals: CurrencyTotals,
  currency: string,
  amount: number,
): void {
  totals[currency] = (totals[currency] ?? 0) + amount;
}

function maxLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), 500);
}

// ────────────────────────────────────────────────────────────────
// CALCUL LIVE
// ────────────────────────────────────────────────────────────────

type ProviderStatsLive = {
  views: number;
  bookingsCreated: number;
  bookingsCompleted: number;
  bookingsCancelled: number;
  bookingsDisputed: number;
  bookingsInProgress: number;
  quotesReceived: number;
  quotesAccepted: number;
  quotesConverted: number;
  avgResponseTimeMin: number | null;
  totalRevenueByCurrency: CurrencyTotals;
  reviewsCount: number;
  reviewsAvgRating: number | null;
  // Approximations — voir commentaires
  viewsPerBookingApprox: number | null;
};

async function computeProviderStats(
  ctx: Ctx,
  providerId: Id<"serviceProviders">,
): Promise<ProviderStatsLive> {
  const provider = await ctx.db.get(providerId);
  if (!provider) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Prestataire introuvable",
    });
  }

  const [bookings, quotes, reviews] = await Promise.all([
    ctx.db
      .query("serviceBookings")
      .withIndex("by_provider", (q) => q.eq("providerId", providerId))
      .collect(),
    ctx.db
      .query("serviceQuotes")
      .withIndex("by_provider", (q) => q.eq("providerId", providerId))
      .collect(),
    ctx.db
      .query("serviceReviews")
      .withIndex("by_provider", (q) => q.eq("providerId", providerId))
      .collect(),
  ]);

  // ── Bookings — distinction explicite par statut
  const bookingsCreated = bookings.length;
  const bookingsCompleted = bookings.filter((b) => b.status === "done").length;
  const bookingsCancelled = bookings.filter(
    (b) => b.status === "cancelled",
  ).length;
  const bookingsDisputed = bookings.filter(
    (b) => b.status === "disputed",
  ).length;
  const bookingsInProgress = bookings.filter(
    (b) => b.status === "in_progress" || b.status === "confirmed",
  ).length;

  // ── Revenue : groupé par devise, jamais agrégé
  const totalRevenueByCurrency: CurrencyTotals = {};
  for (const b of bookings) {
    if (b.status !== "done") continue;
    if (b.totalAmount === undefined || b.currency === undefined) continue;
    addToCurrency(totalRevenueByCurrency, b.currency, b.totalAmount);
  }

  // ── Quotes
  const quotesReceived = quotes.length;
  const quotesAccepted = quotes.filter(
    (q) => q.status === "accepted" || q.status === "converted",
  ).length;
  const quotesConverted = quotes.filter((q) => q.status === "converted").length;

  // ── Temps de réponse moyen
  const responded = quotes.filter(
    (q) => q.respondedAt !== undefined && q.respondedAt > q.createdAt,
  );
  let avgResponseTimeMin: number | null = null;
  if (responded.length > 0) {
    const totalMs = responded.reduce(
      (sum, q) => sum + (q.respondedAt! - q.createdAt),
      0,
    );
    avgResponseTimeMin = Math.round(totalMs / responded.length / 60000);
  }

  // ── Vues (dénormalisé)
  const views = provider.viewCount ?? 0;

  // ── Approximation : nombre de vues par réservation créée.
  // Ce n'est PAS un taux de conversion causal. Une réservation peut
  // provenir d'un retour direct, d'un partage externe, d'un lien
  // profond, sans qu'une vue n'ait été trackée. À présenter comme
  // "densité de réservations par vue" dans l'UI, jamais comme un
  // taux de conversion prouvé.
  const viewsPerBookingApprox =
    bookingsCreated > 0
      ? Math.round((views / bookingsCreated) * 100) / 100
      : null;

  // ── Reviews visibles uniquement
  const visibleReviews = reviews.filter((r) => r.visible !== false);
  const reviewsCount = visibleReviews.length;
  let reviewsAvgRating: number | null = null;
  if (reviewsCount > 0) {
    const total = visibleReviews.reduce((s, r) => s + r.rating, 0);
    reviewsAvgRating = Math.round((total / reviewsCount) * 10) / 10;
  }

  return {
    views,
    bookingsCreated,
    bookingsCompleted,
    bookingsCancelled,
    bookingsDisputed,
    bookingsInProgress,
    quotesReceived,
    quotesAccepted,
    quotesConverted,
    avgResponseTimeMin,
    totalRevenueByCurrency,
    reviewsCount,
    reviewsAvgRating,
    viewsPerBookingApprox,
  };
}

// ────────────────────────────────────────────────────────────────
// LECTURE — PROPRIÉTAIRE
// ────────────────────────────────────────────────────────────────

export const getMyProviderStats = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);
    return computeProviderStats(ctx, args.providerId);
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — PUBLIQUE (sous-ensemble non sensible)
// ────────────────────────────────────────────────────────────────

export const getPublicProviderStats = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) return null;
    if (provider.status !== "active" || provider.isDemo === true) return null;

    const stats = await computeProviderStats(ctx, args.providerId);

    // Non exposé : revenue, avgResponseTimeMin, quotesReceived,
    // viewsPerBookingApprox (données concurrentielles / approximations)
    return {
      views: stats.views,
      bookingsCompleted: stats.bookingsCompleted,
      reviewsCount: stats.reviewsCount,
      reviewsAvgRating: stats.reviewsAvgRating,
      memberSince: provider.createdAt ?? provider._creationTime,
    };
  },
});

// ────────────────────────────────────────────────────────────────
// SNAPSHOT — écriture dans serviceProviderStats
// ────────────────────────────────────────────────────────────────

/**
 * Recalcule et stocke un snapshot.
 *
 * NOTE MULTI-DEVISES : `serviceProviderStats` a un seul champ
 * `totalRevenue` + `revenueCurrency`. On ne peut pas représenter
 * plusieurs devises dans ce schéma sans migration.
 *
 * DÉCISION : on stocke UNIQUEMENT les totaux correspondant à la
 * devise principale du prestataire (`provider.priceCurrency`).
 * Les autres devises restent disponibles via `getMyProviderStats`
 * (query live avec `totalRevenueByCurrency`).
 *
 * Si `provider.priceCurrency` est indéfini, on stocke 0 et "XXX"
 * comme sentinelle — pas de fake.
 */
export const recomputeProviderStats = mutation({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    const provider = await ctx.db.get(args.providerId);
    if (!provider) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Prestataire introuvable",
      });
    }

    const user = await requireUser(ctx);
    const isOwner = provider.userId === user._id;
    const isAdmin = user.isAdmin === true || user.roles?.includes("admin");
    if (!isOwner && !isAdmin) {
      throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." });
    }

    const live = await computeProviderStats(ctx, args.providerId);

    // Devise de référence = celle du provider, pas une "dominante" arbitraire
    const primaryCurrency = provider.priceCurrency ?? null;
    const primaryRevenue =
      primaryCurrency !== null
        ? (live.totalRevenueByCurrency[primaryCurrency] ?? 0)
        : 0;

    const now = Date.now();
    const existing = await ctx.db
      .query("serviceProviderStats")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .unique();

    const payload = {
      providerId: args.providerId,
      views: live.views,
      bookings: live.bookingsCreated,
      bookingsCompleted: live.bookingsCompleted,
      quotesReceived: live.quotesReceived,
      quotesAccepted: live.quotesAccepted,
      avgResponseTimeMin: live.avgResponseTimeMin ?? undefined,
      totalRevenue: primaryRevenue,
      revenueCurrency: primaryCurrency ?? "XXX",
      lastUpdatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return {
        updated: true,
        statsId: existing._id,
        primaryCurrency,
        totalRevenueByCurrency: live.totalRevenueByCurrency,
      };
    }

    const statsId = await ctx.db.insert("serviceProviderStats", payload);
    return {
      updated: false,
      statsId,
      primaryCurrency,
      totalRevenueByCurrency: live.totalRevenueByCurrency,
    };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE — SNAPSHOT
// ────────────────────────────────────────────────────────────────

export const getProviderStatsSnapshot = query({
  args: { providerId: v.id("serviceProviders") },
  handler: async (ctx, args) => {
    await requireOwnedProvider(ctx, args.providerId);

    const snapshot = await ctx.db
      .query("serviceProviderStats")
      .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
      .unique();

    return snapshot ?? null;
  },
});

// ────────────────────────────────────────────────────────────────
// ADMIN — STATS PLATEFORME
// ────────────────────────────────────────────────────────────────

export const getPlatformStats = query({
  args: {
    // DETTE : pas de vraie pagination ici. `sampleLimit` borne
    // le nombre de lignes lues par table. Au-delà, les agrégats
    // sont partiels — le champ `truncated` le signale.
    sampleLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = maxLimit(args.sampleLimit, 1000);

    const [
      providersSample,
      bookingsSample,
      quotesSample,
      reviewsSample,
      disputesSample,
    ] = await Promise.all([
      ctx.db.query("serviceProviders").take(limit + 1),
      ctx.db.query("serviceBookings").take(limit + 1),
      ctx.db.query("serviceQuotes").take(limit + 1),
      ctx.db.query("serviceReviews").take(limit + 1),
      ctx.db.query("serviceDisputes").take(limit + 1),
    ]);

    const truncated =
      providersSample.length > limit ||
      bookingsSample.length > limit ||
      quotesSample.length > limit ||
      reviewsSample.length > limit ||
      disputesSample.length > limit;

    const providers = providersSample.slice(0, limit);
    const bookings = bookingsSample.slice(0, limit);
    const quotes = quotesSample.slice(0, limit);
    const reviews = reviewsSample.slice(0, limit);
    const disputes = disputesSample.slice(0, limit);

    const realProviders = providers.filter((p) => p.isDemo !== true);

    const bookingsByStatus: Record<string, number> = {};
    for (const b of bookings) {
      bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1;
    }

    const platformRevenueByCurrency: CurrencyTotals = {};
    for (const b of bookings) {
      if (b.status !== "done") continue;
      if (b.totalAmount === undefined || b.currency === undefined) continue;
      addToCurrency(platformRevenueByCurrency, b.currency, b.totalAmount);
    }

    return {
      truncated,
      sampledAt: Date.now(),
      sampleLimit: limit,
      providers: {
        sampled: providers.length,
        real: realProviders.length,
        demo: providers.length - realProviders.length,
        active: realProviders.filter((p) => p.status === "active").length,
        verified: realProviders.filter((p) => p.verified).length,
      },
      bookings: {
        sampled: bookings.length,
        byStatus: bookingsByStatus,
      },
      quotes: {
        sampled: quotes.length,
        pending: quotes.filter((q) => q.status === "pending").length,
        accepted: quotes.filter((q) => q.status === "accepted").length,
        converted: quotes.filter((q) => q.status === "converted").length,
      },
      reviews: {
        sampled: reviews.length,
        visible: reviews.filter((r) => r.visible !== false).length,
      },
      disputes: {
        sampled: disputes.length,
        open: disputes.filter((d) => d.status === "open").length,
      },
      revenueByCurrency: platformRevenueByCurrency,
    };
  },
});
