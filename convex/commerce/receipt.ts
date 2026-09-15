// convex/commerce/receipt.ts
import { v, ConvexError } from "convex/values";
import { query } from "../_generated/server";
import { requireQueryUser } from "../publications";
import type { Id } from "../_generated/dataModel";

export const getTransactionReceipt = query({
  args: {
    transactionId: v.string(),
    type: v.union(v.literal("order"), v.literal("wallet")),
  },
  handler: async (ctx, args) => {
    const user = await requireQueryUser(ctx);

    if (args.type === "order") {
      const order = await ctx.db.get(args.transactionId as Id<"orders">);
      if (!order) return null;
      if (order.buyerId !== user._id && order.sellerId !== user._id)
        return null;

      const product = order.productId
        ? await ctx.db.get(order.productId)
        : null;
      const buyer = await ctx.db.get(order.buyerId);
      const seller = await ctx.db.get(order.sellerId);

      return {
        type: "order",
        _id: order._id,
        number: order._id.slice(0, 8),
        date: new Date(order._creationTime).toISOString(),
        amount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        buyerName: buyer?.name || "Client",
        sellerName: seller?.name || "Vendeur",
        items: product
          ? [
              {
                description: product.title,
                quantity: order.quantity,
                total: order.totalAmount,
              },
            ]
          : [],
        subtotal: order.totalAmount,
        tax: 0,
        total: order.totalAmount,
        notes: order.note,
      };
    }

    if (args.type === "wallet") {
      const tx = await ctx.db.get(
        args.transactionId as Id<"walletTransactions">,
      );
      if (!tx) return null;
      if (tx.userId !== user._id) return null;

      const counterpart = tx.counterpartId
        ? await ctx.db.get(tx.counterpartId)
        : null;

      return {
        type: "wallet",
        _id: tx._id,
        number: tx._id.slice(0, 8),
        date: new Date(tx._creationTime).toISOString(),
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        description: tx.description,
        counterpartName: counterpart?.name || "Système",
        typeLabel: tx.type,
        referenceId: tx.referenceId,
      };
    }

    return null;
  },
});
