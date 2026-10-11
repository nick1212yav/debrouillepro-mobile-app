// convex/commerce/escrow.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// SÉCURITÉ : les mutations d'escrow ont été neutralisées.
//
// Avant :
//   - `initiateEscrowPayment` créait un walletTransactions (pending)
//   - `confirmEscrowPayment` le passait à completed SANS preuve de paiement
//   - `releaseEscrowPayment` créditait le seller en deposit/completed
//   - `cancelEscrowPayment` créditait le buyer en refund/completed
//
// Un utilisateur authentifié pouvait donc créditer n'importe quel wallet
// (seller ou buyer) sans qu'aucun paiement externe n'ait été vérifié.
//
// Le Payment Core (convex/payments.ts) est désormais l'unique chemin
// financier autorisé :
//   createPaymentIntent -> startPayment -> Provider -> finalizeProviderSuccess
//
// Les signatures d'arguments sont conservées pour ne pas casser les appelants
// existants ; seuls les handlers sont neutralisés.
//
// Conservé tel quel :
//   - disputeEscrowPayment (ne touche pas au ledger)
//   - getEscrowStatus / getMyEscrowTransactions (read-only)
// ─────────────────────────────────────────────────────────────────────────────

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
  handler: async () => {
    throw new ConvexError({
      code: "DEPRECATED_ENDPOINT",
      message:
        "Ce endpoint est désactivé. Utilisez le Payment Core : api.payments.createPaymentIntent + startPayment.",
    });
  },
});

export const releaseEscrowPayment = mutation({
  args: {
    escrowId: v.id("escrowTransactions"),
  },
  handler: async () => {
    throw new ConvexError({
      code: "DEPRECATED_ENDPOINT",
      message:
        "Ce endpoint est désactivé. La libération des fonds doit être déclenchée par un événement provider vérifié.",
    });
  },
});

export const confirmEscrowPayment = mutation({
  args: {
    escrowId: v.id("escrowTransactions"),
  },
  handler: async () => {
    throw new ConvexError({
      code: "DEPRECATED_ENDPOINT",
      message:
        "Ce endpoint est désactivé. La confirmation d'escrow doit provenir d'un événement provider vérifié.",
    });
  },
});

export const cancelEscrowPayment = mutation({
  args: {
    escrowId: v.id("escrowTransactions"),
  },
  handler: async () => {
    throw new ConvexError({
      code: "DEPRECATED_ENDPOINT",
      message:
        "Ce endpoint est désactivé. L'annulation d'escrow et les remboursements doivent passer par le Payment Core.",
    });
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
