import { v, ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { requireUser } from "./publications";

// ── Queries ───────────────────────────────────────────────────────────────────

export const getPublicationStats = query({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });

    // Récupérer les offres (table publicationOffers)
    const offers = await ctx.db
      .query("publicationOffers")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .collect();

    // Récupérer les favoris (publicationFavorites)
    const favorites = await ctx.db
      .query("publicationFavorites")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .collect();

    // Récupérer les partages (publicationShares)
    const shares = await ctx.db
      .query("publicationShares")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .collect();

    return {
      views: pub.viewCount,
      likes: pub.likeCount,
      favorites: favorites.length,
      shares: shares.length,
      offers: offers.length,
      averageRating: pub.avgRating || 0,
      reviewCount: pub.reviewCount || 0,
    };
  },
});

export const getVendorStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      // On utilise une fonction helper pour obtenir l'utilisateur connecté en query
      const identity = await ctx.auth.getUserIdentity();
      if (!identity)
        throw new ConvexError({
          message: "Non authentifié",
          code: "UNAUTHENTICATED",
        });
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (!user)
        throw new ConvexError({
          message: "Utilisateur introuvable",
          code: "NOT_FOUND",
        });
      userId = user._id;
    }

    const publications = await ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    // Récupérer les commandes (table orders) où le vendeur est l'utilisateur (on utilise le champ sellerId)
    // Le schéma orders a un champ sellerId
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("sellerId"), userId))
      .collect();

    const sales = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      publications: publications.length,
      totalViews: publications.reduce((s, p) => s + p.viewCount, 0),
      totalLikes: publications.reduce((s, p) => s + p.likeCount, 0),
      totalOffers: publications.reduce((s, p) => s + (p.offerCount || 0), 0),
      totalReviews: publications.reduce((s, p) => s + (p.reviewCount || 0), 0),
      avgRating:
        publications.reduce((s, p) => s + (p.avgRating || 0), 0) /
        (publications.length || 1),
      orders: orders.length,
      sales,
      revenue,
    };
  },
});
