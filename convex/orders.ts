import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireQueryUser } from "./publications";
import type { Doc } from "./_generated/dataModel";

// ── Queries ───────────────────────────────────────────────────────────────────

export const getOrder = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const user = await requireQueryUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order)
      throw new ConvexError({
        message: "Commande introuvable",
        code: "NOT_FOUND",
      });
    if (order.buyerId !== user._id && order.sellerId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    return order;
  },
});

export const listOrders = query({
  args: {
    asBuyer: v.optional(v.boolean()),
    asSeller: v.optional(v.boolean()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireQueryUser(ctx);
    let orders: Doc<"orders">[] = [];

    if (args.asBuyer) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
        .collect();
    } else if (args.asSeller) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
        .collect();
    } else {
      const buyerOrders = await ctx.db
        .query("orders")
        .withIndex("by_buyer", (q) => q.eq("buyerId", user._id))
        .collect();
      const sellerOrders = await ctx.db
        .query("orders")
        .withIndex("by_seller", (q) => q.eq("sellerId", user._id))
        .collect();
      const all = [...buyerOrders, ...sellerOrders];
      const seen = new Set();
      orders = all.filter((o) => {
        const key = o._id.toString();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (args.status) {
      orders = orders.filter((o) => o.status === args.status);
    }

    return orders
      .sort((a, b) => (a._creationTime < b._creationTime ? 1 : -1))
      .slice(0, 50);
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createOrder = mutation({
  args: {
    publicationId: v.id("publications"),
    quantity: v.number(),
    deliveryAddress: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId === user._id)
      throw new ConvexError({
        message: "Vous ne pouvez pas acheter votre propre annonce",
        code: "FORBIDDEN",
      });
    if (pub.isSold)
      throw new ConvexError({
        message: "Annonce déjà vendue",
        code: "BAD_REQUEST",
      });

    const price = parseFloat(pub.price || "0");
    if (price <= 0)
      throw new ConvexError({ message: "Prix invalide", code: "BAD_REQUEST" });

    const totalAmount = price * args.quantity;
    const currency = pub.meta ? JSON.parse(pub.meta)?.currency || "USD" : "USD";

    const orderId = await ctx.db.insert("orders", {
      buyerId: user._id,
      sellerId: pub.authorId,
      productId: pub._id as any,
      quantity: args.quantity,
      totalAmount,
      currency,
      status: "pending",
      deliveryAddress: args.deliveryAddress,
      note: args.note,
      publicationId: args.publicationId,
    });

    return { orderId };
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("confirmed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order)
      throw new ConvexError({
        message: "Commande introuvable",
        code: "NOT_FOUND",
      });

    if (
      args.status === "confirmed" ||
      args.status === "shipped" ||
      args.status === "delivered"
    ) {
      if (order.sellerId !== user._id)
        throw new ConvexError({
          message: "Seul le vendeur peut modifier ce statut",
          code: "FORBIDDEN",
        });
    } else if (args.status === "cancelled" || args.status === "refunded") {
      if (order.buyerId !== user._id && order.sellerId !== user._id)
        throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    }

    await ctx.db.patch(args.orderId, { status: args.status });
    return { success: true };
  },
});
