import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./publications";

// ── Queries ───────────────────────────────────────────────────────────────────

export const listOffersForPublication = query({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    // Vérifier que la publication existe
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });

    const offers = await ctx.db
      .query("publicationOffers")
      .withIndex("by_publication", (q) =>
        q.eq("publicationId", args.publicationId),
      )
      .order("desc")
      .collect();

    // Récupérer les noms des acheteurs
    const withBuyers = await Promise.all(
      offers.map(async (offer) => {
        const buyer = await ctx.db.get(offer.buyerId);
        return {
          ...offer,
          buyerName: buyer?.name || "Utilisateur",
        };
      }),
    );
    return withBuyers;
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createOffer = mutation({
  args: {
    publicationId: v.id("publications"),
    amount: v.number(),
    message: v.optional(v.string()),
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
        message: "Vous ne pouvez pas faire d'offre sur votre propre annonce",
        code: "FORBIDDEN",
      });

    // Vérifier que l'annonce n'est pas déjà vendue ou réservée
    if (pub.isSold)
      throw new ConvexError({
        message: "Annonce déjà vendue",
        code: "BAD_REQUEST",
      });
    if (pub.isReserved)
      throw new ConvexError({
        message: "Annonce déjà réservée",
        code: "BAD_REQUEST",
      });

    const offerId = await ctx.db.insert("publicationOffers", {
      publicationId: args.publicationId,
      buyerId: user._id,
      amount: args.amount,
      message: args.message || "",
      status: "pending",
      createdAt: Date.now(),
    });

    // Incrémenter le compteur d'offres dans la publication
    await ctx.db.patch(args.publicationId, {
      offerCount: (pub.offerCount || 0) + 1,
    });

    return offerId;
  },
});

export const updateOfferStatus = mutation({
  args: {
    offerId: v.id("publicationOffers"),
    status: v.union(
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("countered"),
    ),
    counterAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const offer = await ctx.db.get(args.offerId);
    if (!offer)
      throw new ConvexError({
        message: "Offre introuvable",
        code: "NOT_FOUND",
      });

    const pub = await ctx.db.get(offer.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });

    // Seul le propriétaire de la publication peut modifier le statut
    if (pub.authorId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });

    await ctx.db.patch(args.offerId, {
      status: args.status,
      ...(args.counterAmount !== undefined && {
        counterAmount: args.counterAmount,
      }),
    });

    if (args.status === "accepted") {
      // Marquer la publication comme réservée
      await ctx.db.patch(pub._id, { isReserved: true });
    }

    return { success: true };
  },
});
