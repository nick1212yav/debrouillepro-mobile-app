import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./publications";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listReviews = query({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("publicationReviews")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .order("desc")
      .collect();

    // Ajouter le nom du reviewer
    const withReviewers = await Promise.all(
      reviews.map(async (rev) => {
        const user = await ctx.db.get(rev.reviewerId);
        return {
          ...rev,
          reviewerName: user?.name || "Anonyme",
        };
      }),
    );
    return withReviewers;
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createReview = mutation({
  args: {
    publicationId: v.id("publications"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Vérifier que l'utilisateur a bien acheté l'article (ou est le vendeur)
    // On pourrait vérifier l'historique des commandes, mais pour simplifier on autorise
    // uniquement l'acheteur à laisser un avis.
    // On vérifie qu'il existe une offre acceptée pour cette publication
    const offer = await ctx.db
      .query("publicationOffers")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("buyerId"), user._id),
          q.eq(q.field("status"), "accepted"),
        ),
      )
      .first();
    if (!offer)
      throw new ConvexError({
        message: "Vous devez avoir acheté cet article pour laisser un avis",
        code: "FORBIDDEN",
      });

    // Vérifier si l'utilisateur a déjà laissé un avis
    const existing = await ctx.db
      .query("publicationReviews")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .filter((q) => q.eq(q.field("reviewerId"), user._id))
      .first();
    if (existing)
      throw new ConvexError({
        message: "Vous avez déjà laissé un avis",
        code: "BAD_REQUEST",
      });

    const reviewId = await ctx.db.insert("publicationReviews", {
      publicationId: args.publicationId,
      reviewerId: user._id,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });

    // Mettre à jour la moyenne et le nombre d'avis sur la publication
    const allReviews = await ctx.db
      .query("publicationReviews")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .collect();
    const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = total / allReviews.length;

    await ctx.db.patch(args.publicationId, {
      avgRating: avg,
      reviewCount: allReviews.length,
    });

    return reviewId;
  },
});

export const deleteReview = mutation({
  args: { reviewId: v.id("publicationReviews") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review)
      throw new ConvexError({ message: "Avis introuvable", code: "NOT_FOUND" });

    // Seul l'auteur de l'avis ou un admin peut supprimer
    if (review.reviewerId !== user._id) {
      // Vérifier si l'utilisateur est admin (à implémenter)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    }

    await ctx.db.delete(args.reviewId);

    // Recalculer la moyenne
    const allReviews = await ctx.db
      .query("publicationReviews")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", review.publicationId),
      )
      .collect();
    const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = allReviews.length > 0 ? total / allReviews.length : 0;

    await ctx.db.patch(review.publicationId, {
      avgRating: avg,
      reviewCount: allReviews.length,
    });
  },
});
