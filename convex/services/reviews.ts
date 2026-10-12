// convex/services/reviews.ts
//
// Backend Services V1 — avis.
//
// Règles :
//   - un avis = une réservation "done"
//   - un seul avis par réservation (index by_booking)
//   - rating entier strict de 1 à 5
//   - un signalement par user par avis

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

async function requireProvider(
  ctx: Ctx,
  providerId: Id<"serviceProviders">,
): Promise<Doc<"serviceProviders">> {
  const provider = await ctx.db.get(providerId);
  if (!provider) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Prestataire introuvable",
    });
  }
  return provider;
}

// ────────────────────────────────────────────────────────────────
// VALIDATION RATING — entier strict, pas d'arrondi
// ────────────────────────────────────────────────────────────────

function assertRating(value: number): number {
  if (!Number.isInteger(value)) {
    throw new ConvexError({
      code: "INVALID_RATING",
      message: "La note doit être un entier (pas de décimales).",
    });
  }
  if (value < 1 || value > 5) {
    throw new ConvexError({
      code: "INVALID_RATING",
      message: "La note doit être comprise entre 1 et 5.",
    });
  }
  return value;
}

const MAX_LIMIT = 100;

function clampLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

// ────────────────────────────────────────────────────────────────
// RECALCUL RATING — source unique de vérité
// ────────────────────────────────────────────────────────────────

async function recomputeProviderRating(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
): Promise<void> {
  const reviews = await ctx.db
    .query("serviceReviews")
    .withIndex("by_provider", (q) => q.eq("providerId", providerId))
    .collect();

  const visibleReviews = reviews.filter((r) => r.visible !== false);

  if (visibleReviews.length === 0) {
    await ctx.db.patch(providerId, { rating: 0, reviewCount: 0 });
    return;
  }

  const total = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
  const avg = total / visibleReviews.length;
  const rounded = Math.round(avg * 10) / 10;

  await ctx.db.patch(providerId, {
    rating: rounded,
    reviewCount: visibleReviews.length,
  });
}

async function logHistory(
  ctx: MutationCtx,
  providerId: Id<"serviceProviders">,
  event: string,
  actorId: Id<"users">,
): Promise<void> {
  await ctx.db.insert("serviceHistory", {
    providerId,
    event,
    actorId,
    type: event,
    createdAt: Date.now(),
  });
}

// ────────────────────────────────────────────────────────────────
// CRÉATION
// ────────────────────────────────────────────────────────────────

export const createReview = mutation({
  args: {
    bookingId: v.id("serviceBookings"),
    rating: v.number(),
    comment: v.string(),
    photos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Réservation introuvable",
      });
    }

    if (booking.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le client de la réservation peut laisser un avis.",
      });
    }

    if (booking.status !== "done") {
      throw new ConvexError({
        code: "BOOKING_NOT_DONE",
        message:
          "Vous ne pouvez laisser un avis qu'après la fin de la prestation.",
      });
    }

    // Unicité via index by_booking — O(log n), atomique sous OCC
    const existing = await ctx.db
      .query("serviceReviews")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .unique();

    if (existing) {
      throw new ConvexError({
        code: "REVIEW_ALREADY_EXISTS",
        message: "Vous avez déjà laissé un avis pour cette réservation.",
      });
    }

    const rating = assertRating(args.rating);

    const comment = args.comment.trim();
    if (comment.length < 3) {
      throw new ConvexError({
        code: "INVALID_COMMENT",
        message: "Le commentaire est trop court.",
      });
    }
    if (comment.length > 2000) {
      throw new ConvexError({
        code: "INVALID_COMMENT",
        message: "Le commentaire est trop long (2000 caractères max).",
      });
    }

    const now = Date.now();

    const reviewId = await ctx.db.insert("serviceReviews", {
      providerId: booking.providerId,
      reviewerId: user._id,
      bookingId: args.bookingId,
      rating,
      comment,
      photos: args.photos,
      visible: true,
      reported: false,
      createdAt: now,
    });

    await recomputeProviderRating(ctx, booking.providerId);
    await logHistory(ctx, booking.providerId, "review.created", user._id);

    return { reviewId };
  },
});

// ────────────────────────────────────────────────────────────────
// MODIFICATION
// ────────────────────────────────────────────────────────────────

export const updateReview = mutation({
  args: {
    reviewId: v.id("serviceReviews"),
    rating: v.optional(v.number()),
    comment: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review)
      throw new ConvexError({ code: "NOT_FOUND", message: "Avis introuvable" });

    if (review.reviewerId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul l'auteur peut modifier son avis.",
      });
    }

    const patch: Partial<Doc<"serviceReviews">> = {};

    if (args.rating !== undefined) {
      patch.rating = assertRating(args.rating);
    }

    if (args.comment !== undefined) {
      const c = args.comment.trim();
      if (c.length < 3 || c.length > 2000) {
        throw new ConvexError({
          code: "INVALID_COMMENT",
          message: "Commentaire invalide (3 à 2000 caractères).",
        });
      }
      patch.comment = c;
    }

    if (args.photos !== undefined) patch.photos = args.photos;

    patch.editedAt = Date.now();

    await ctx.db.patch(args.reviewId, patch);
    await recomputeProviderRating(ctx, review.providerId);

    return { success: true };
  },
});

export const deleteReview = mutation({
  args: { reviewId: v.id("serviceReviews") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review)
      throw new ConvexError({ code: "NOT_FOUND", message: "Avis introuvable" });

    if (review.reviewerId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul l'auteur peut supprimer son avis.",
      });
    }

    await ctx.db.delete(args.reviewId);
    await recomputeProviderRating(ctx, review.providerId);
    await logHistory(ctx, review.providerId, "review.deleted", user._id);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// RÉPONSE DU PRESTATAIRE
// ────────────────────────────────────────────────────────────────

export const respondToReview = mutation({
  args: {
    reviewId: v.id("serviceReviews"),
    response: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review)
      throw new ConvexError({ code: "NOT_FOUND", message: "Avis introuvable" });

    const provider = await requireProvider(ctx, review.providerId);
    if (provider.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Seul le prestataire concerné peut répondre.",
      });
    }

    const response = args.response.trim();
    if (response.length < 3 || response.length > 2000) {
      throw new ConvexError({
        code: "INVALID_RESPONSE",
        message: "Réponse invalide (3 à 2000 caractères).",
      });
    }

    const now = Date.now();
    await ctx.db.patch(args.reviewId, {
      providerResponse: response,
      responseAt: now,
    });

    await logHistory(ctx, review.providerId, "review.responded", user._id);

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// SIGNALEMENT — un user = un signalement par avis
// ────────────────────────────────────────────────────────────────

export const reportReview = mutation({
  args: {
    reviewId: v.id("serviceReviews"),
    reason: v.union(
      v.literal("spam"),
      v.literal("fake"),
      v.literal("inappropriate"),
      v.literal("harassment"),
      v.literal("fraud"),
      v.literal("other"),
    ),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review)
      throw new ConvexError({ code: "NOT_FOUND", message: "Avis introuvable" });

    if (review.reviewerId === user._id) {
      throw new ConvexError({
        code: "SELF_REPORT",
        message: "Vous ne pouvez pas signaler votre propre avis.",
      });
    }

    // Un seul signalement par user sur ce review
    const existing = await ctx.db
      .query("serviceReports")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "review").eq("targetId", args.reviewId),
      )
      .filter((q) => q.eq(q.field("reporterId"), user._id))
      .first();

    if (existing) {
      throw new ConvexError({
        code: "ALREADY_REPORTED",
        message: "Vous avez déjà signalé cet avis.",
      });
    }

    // Flag `reported` sur le review — indicateur global de modération
    if (review.reported !== true) {
      await ctx.db.patch(args.reviewId, { reported: true });
    }

    await ctx.db.insert("serviceReports", {
      targetType: "review",
      targetId: args.reviewId,
      reporterId: user._id,
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ────────────────────────────────────────────────────────────────
// LECTURE
// ────────────────────────────────────────────────────────────────

export const getReviews = query({
  args: {
    providerId: v.id("serviceProviders"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = clampLimit(args.limit, 50);

    const reviews = await ctx.db
      .query("serviceReviews")
      .withIndex("by_provider_and_createdAt", (q) =>
        q.eq("providerId", args.providerId),
      )
      .order("desc")
      .take(limit);

    const visible = reviews.filter((r) => r.visible !== false);

    return Promise.all(
      visible.map(async (r) => {
        const user = await ctx.db.get(r.reviewerId);
        return {
          ...r,
          reviewerName: user?.name ?? "Anonyme",
          reviewerAvatar: user?.avatar,
        };
      }),
    );
  },
});

export const listMyReviews = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) return [];
    const limit = clampLimit(args.limit, 50);

    const reviews = await ctx.db
      .query("serviceReviews")
      .withIndex("by_reviewer", (q) => q.eq("reviewerId", user._id))
      .order("desc")
      .take(limit);

    return Promise.all(
      reviews.map(async (r) => {
        const provider = await ctx.db.get(r.providerId);
        return { ...r, provider };
      }),
    );
  },
});
