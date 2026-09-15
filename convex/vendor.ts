import { v, ConvexError } from "convex/values";
import { query } from "./_generated/server";
// Note : on n'utilise pas requireUser ici car on est en query, on gère l'auth manuellement
import { requireUser } from "./publications"; // seulement pour les mutations, mais ici on est en query

// ── Queries ───────────────────────────────────────────────────────────────────

export const getStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
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

    // Utiliser sellerId dans orders
    const orders = await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("sellerId"), userId))
      .collect();

    const sales = orders.filter((o) => o.status === "delivered").length;
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      annonces: publications.length,
      views: publications.reduce((s, p) => s + p.viewCount, 0),
      sales,
      revenue,
      customers: new Set(orders.map((o) => o.buyerId)).size,
    };
  },
});

export const getAnnonces = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return [];
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (!user) return [];
      userId = user._id;
    }
    return await ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();
  },
});

export const getOrders = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return [];
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      if (!user) return [];
      userId = user._id;
    }
    return await ctx.db
      .query("orders")
      .filter((q) => q.eq(q.field("sellerId"), userId))
      .order("desc")
      .collect();
  },
});
