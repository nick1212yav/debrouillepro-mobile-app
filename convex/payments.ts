import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./publications";

// ── Queries ───────────────────────────────────────────────────────────────────

export const getPaymentMethods = query({
  args: {},
  handler: async () => {
    return [
      { id: "orange_money", label: "Orange Money", enabled: true },
      { id: "airtel_money", label: "Airtel Money", enabled: true },
      { id: "mpesa", label: "M-Pesa", enabled: true },
      { id: "card", label: "Carte bancaire", enabled: true },
      { id: "wallet", label: "DébrouillePay", enabled: true },
      { id: "crypto", label: "Crypto (USDT)", enabled: false },
    ];
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const processPayment = mutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    currency: v.string(),
    method: v.string(),
    providerData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const order = await ctx.db.get(args.orderId);
    if (!order)
      throw new ConvexError({
        message: "Commande introuvable",
        code: "NOT_FOUND",
      });
    if (order.buyerId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });

    // Simuler un paiement (on enregistre dans une table "payments" si elle existe, sinon on skip)
    // Dans l'immédiat, on met à jour le statut de la commande en "confirmed" (ou "paid" si ajouté)
    await ctx.db.patch(args.orderId, {
      status: "confirmed", // ou "paid" si vous ajoutez "paid" au schéma
      // On pourrait aussi stocker l'info de paiement dans un champ meta
    });

    // Optionnel : enregistrer dans une table payments (si elle existe)
    // const paymentId = await ctx.db.insert("payments", {
    //   orderId: args.orderId,
    //   userId: user._id,
    //   amount: args.amount,
    //   currency: args.currency,
    //   method: args.method,
    //   status: "completed",
    //   createdAt: Date.now(),
    //   providerData: args.providerData,
    // });

    return { success: true };
  },
});
