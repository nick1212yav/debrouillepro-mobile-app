// convex/commerce/escrow.ts
import { v, ConvexError } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUser, requireQueryUser } from "../publications";
import type { Id } from "../_generated/dataModel";

// ─── Mutations ────────────────────────────────────────────────────────────

export const initiateEscrowPayment = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    sellerId: v.id("users"),
    orderId: v.optional(v.id("orders")),
    productId: v.optional(v.id("products")),
    method: v.union(
      v.literal("mobile_money"),
      v.literal("card"),
      v.literal("bank_transfer"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const seller = await ctx.db.get(args.sellerId);
    if (!seller) {
      throw new ConvexError({
        message: "Vendeur introuvable",
        code: "NOT_FOUND",
      });
    }

    if (user._id === args.sellerId) {
      throw new ConvexError({
        message: "Vous ne pouvez pas payer votre propre produit",
        code: "FORBIDDEN",
      });
    }

    const escrowId = await ctx.db.insert("escrowTransactions", {
      buyerId: user._id,
      sellerId: args.sellerId,
      orderId: args.orderId,
      productId: args.productId,
      amount: args.amount,
      currency: args.currency,
      method: args.method,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "payment",
      amount: args.amount,
      currency: args.currency,
      description: `Paiement sécurisé - ${escrowId}`,
      status: "pending",
      referenceId: escrowId,
      counterpartId: args.sellerId,
    });

    return { escrowId, transactionId: escrowId };
  },
});

export const releaseEscrowPayment = mutation({
  args: {
    escrowId: v.id("escrowTransactions"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const escrow = await ctx.db.get(args.escrowId);
    if (!escrow) {
      throw new ConvexError({
        message: "Transaction introuvable",
        code: "NOT_FOUND",
      });
    }

    if (escrow.buyerId !== user._id) {
      throw new ConvexError({
        message: "Seul l'acheteur peut confirmer la réception",
        code: "FORBIDDEN",
      });
    }

    if (escrow.status !== "confirmed") {
      throw new ConvexError({
        message: "Le paiement n'est pas encore confirmé",
        code: "INVALID_STATE",
      });
    }

    await ctx.db.patch(args.escrowId, {
      status: "released",
      releasedAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("walletTransactions", {
      userId: escrow.sellerId,
      type: "deposit",
      amount: escrow.amount,
      currency: escrow.currency,
      description: `Libération des fonds - ${args.escrowId}`,
      status: "completed",
      referenceId: args.escrowId,
      counterpartId: escrow.buyerId,
      completedAt: new Date().toISOString(), // ✅ string
    });

    if (escrow.orderId) {
      await ctx.db.patch(escrow.orderId, {
        status: "delivered",
        deliveredAt: new Date().toISOString(), // ✅ string
      });
    }

    return { success: true };
  },
});

export const confirmEscrowPayment = mutation({
  args: {
    escrowId: v.id("escrowTransactions"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const escrow = await ctx.db.get(args.escrowId);
    if (!escrow) {
      throw new ConvexError({
        message: "Transaction introuvable",
        code: "NOT_FOUND",
      });
    }

    if (escrow.buyerId !== user._id && escrow.sellerId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    if (escrow.status !== "pending") {
      throw new ConvexError({
        message: "Transaction déjà traitée",
        code: "INVALID_STATE",
      });
    }

    await ctx.db.patch(args.escrowId, {
      status: "confirmed",
      confirmedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Mettre à jour la transaction wallet (sans index by_reference)
    const walletTx = await ctx.db
      .query("walletTransactions")
      .filter((q) => q.eq(q.field("referenceId"), args.escrowId))
      .unique();
    if (walletTx) {
      await ctx.db.patch(walletTx._id, {
        status: "completed",
        completedAt: new Date().toISOString(), // ✅ string
      });
    }

    return { success: true };
  },
});

export const cancelEscrowPayment = mutation({
  args: {
    escrowId: v.id("escrowTransactions"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const escrow = await ctx.db.get(args.escrowId);
    if (!escrow) {
      throw new ConvexError({
        message: "Transaction introuvable",
        code: "NOT_FOUND",
      });
    }

    if (escrow.buyerId !== user._id && escrow.sellerId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    if (escrow.status === "released") {
      throw new ConvexError({
        message: "Les fonds ont déjà été libérés",
        code: "INVALID_STATE",
      });
    }

    await ctx.db.patch(args.escrowId, {
      status: "cancelled",
      cancelledAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (escrow.status === "confirmed") {
      await ctx.db.insert("walletTransactions", {
        userId: escrow.buyerId,
        type: "refund",
        amount: escrow.amount,
        currency: escrow.currency,
        description: `Remboursement - ${args.escrowId}`,
        status: "completed",
        referenceId: args.escrowId,
        counterpartId: escrow.sellerId,
        completedAt: new Date().toISOString(), // ✅ string
      });
    }

    return { success: true };
  },
});

export const disputeEscrowPayment = mutation({
  args: {
    escrowId: v.id("escrowTransactions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const escrow = await ctx.db.get(args.escrowId);
    if (!escrow) {
      throw new ConvexError({
        message: "Transaction introuvable",
        code: "NOT_FOUND",
      });
    }

    if (escrow.buyerId !== user._id && escrow.sellerId !== user._id) {
      throw new ConvexError({
        message: "Non autorisé",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.escrowId, {
      status: "disputed",
      disputeReason: args.reason,
      disputedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ─── Queries ───────────────────────────────────────────────────────────────

export const getEscrowStatus = query({
  args: { transactionId: v.string() },
  handler: async (ctx, args) => {
    // ✅ Utilisation de requireQueryUser (pas requireUser)
    const user = await requireQueryUser(ctx);

    const escrow = await ctx.db
      .query("escrowTransactions")
      .filter((q) => q.eq(q.field("_id"), args.transactionId))
      .unique();

    if (!escrow) return null;

    // Vérifier que l'utilisateur est impliqué
    if (escrow.buyerId !== user._id && escrow.sellerId !== user._id) {
      return null;
    }

    return {
      id: escrow._id,
      status: escrow.status,
      amount: escrow.amount,
      currency: escrow.currency,
      createdAt: escrow.createdAt,
      updatedAt: escrow.updatedAt,
      releasedAt: escrow.releasedAt,
      confirmedAt: escrow.confirmedAt,
      cancelledAt: escrow.cancelledAt,
      disputedAt: escrow.disputedAt,
      disputeReason: escrow.disputeReason,
    };
  },
});

export const getMyEscrowTransactions = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireQueryUser(ctx);

    let query = ctx.db.query("escrowTransactions");
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const transactions = await query.collect();
    return transactions.filter(
      (t) => t.buyerId === user._id || t.sellerId === user._id,
    );
  },
});
