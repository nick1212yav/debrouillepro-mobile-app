import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { requireUser } from "./publications";

export const reservePublication = mutation({
  args: {
    publicationId: v.id("publications"),
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
        message: "Vous ne pouvez pas réserver votre propre annonce",
        code: "FORBIDDEN",
      });
    if (pub.isReserved)
      throw new ConvexError({ message: "Déjà réservé", code: "BAD_REQUEST" });
    if (pub.isSold)
      throw new ConvexError({ message: "Déjà vendu", code: "BAD_REQUEST" });

    await ctx.db.patch(args.publicationId, { isReserved: true });
    // Notification au vendeur
    await ctx.db.insert("notifications", {
      userId: pub.authorId,
      type: "system",
      module: "annonces",
      title: "Nouvelle réservation",
      body: `${user.name} souhaite réserver votre annonce : ${pub.title}`,
      read: false,
      pinned: false,
      priority: "high",
      actionPage: `/annonce/${args.publicationId}`,
    });
    return { success: true };
  },
});

export const cancelReservation = mutation({
  args: { publicationId: v.id("publications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const pub = await ctx.db.get(args.publicationId);
    if (!pub)
      throw new ConvexError({
        message: "Publication introuvable",
        code: "NOT_FOUND",
      });
    if (pub.authorId !== user._id)
      throw new ConvexError({
        message: "Seul le propriétaire peut annuler",
        code: "FORBIDDEN",
      });
    await ctx.db.patch(args.publicationId, { isReserved: false });
    return { success: true };
  },
});
