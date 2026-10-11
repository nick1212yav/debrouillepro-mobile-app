// convex/commerce/refund.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// SÉCURITÉ : approveRefund a été neutralisée.
//
// Avant : le vendeur pouvait approuver une demande de remboursement, ce qui
// créditait immédiatement le wallet de l'acheteur (type "refund",
// status "completed") sans qu'aucun paiement externe préalable n'ait été
// vérifié.
//
// Le Payment Core (convex/payments.ts) est désormais l'unique chemin
// financier autorisé :
//   createPaymentIntent -> startPayment -> Provider -> finalizeProviderSuccess
//
// Conservé tel quel :
//   - requestRefund (crée uniquement une refundRequests, pas de ledger)
//   - rejectRefund (ne touche pas au ledger)
//   - getMyRefunds (read-only)
//
// La signature d'arguments d'approveRefund est conservée pour ne pas casser
// les appelants existants ; seul le handler est neutralisé.
// ─────────────────────────────────────────────────────────────────────────────

import { v, ConvexError } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireUser, requireQueryUser } from "../publications";
import type { Id } from "../_generated/dataModel";

export const requestRefund = mutation({
  args: {
    orderId: v.id("orders"),
    reason: v.string(),
    comment: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Commande introuvable",
        code: "NOT_FOUND",
      });
    }

    if (order.buyerId !== user._id && order.sellerId !== user._id) {
      throw new ConvexError({
        message: "Vous n'êtes pas autorisé",
        code: "FORBIDDEN",
      });
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      throw new ConvexError({
        message: "Cette commande a déjà été annulée ou remboursée",
        code: "INVALID_STATE",
      });
    }

    const refundAmount = args.amount || order.totalAmount;

    const refundId = await ctx.db.insert("refundRequests", {
      orderId: args.orderId,
      requesterId: user._id,
      amount: refundAmount,
      currency: order.currency,
      reason: args.reason,
      comment: args.comment,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { refundId };
  },
});

export const approveRefund = mutation({
  args: {
    refundId: v.id("refundRequests"),
  },
  handler: async () => {
    throw new ConvexError({
      code: "DEPRECATED_ENDPOINT",
      message:
        "Ce endpoint est désactivé. Les remboursements doivent être exécutés via le Payment Core, après vérification du provider.",
    });
  },
});

export const rejectRefund = mutation({
  args: {
    refundId: v.id("refundRequests"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const refund = await ctx.db.get(args.refundId);
    if (!refund) {
      throw new ConvexError({
        message: "Demande introuvable",
        code: "NOT_FOUND",
      });
    }

    const order = await ctx.db.get(refund.orderId);
    if (!order) {
      throw new ConvexError({
        message: "Commande introuvable",
        code: "NOT_FOUND",
      });
    }

    if (order.sellerId !== user._id) {
      throw new ConvexError({
        message: "Seul le vendeur peut rejeter un remboursement",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.refundId, {
      status: "rejected",
      rejectionReason: args.reason,
      rejectedBy: user._id,
      rejectedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const getMyRefunds = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireQueryUser(ctx);

    let query = ctx.db.query("refundRequests");
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const refunds = await query.collect();
    return refunds.filter((r) => r.requesterId === user._id);
  },
});
