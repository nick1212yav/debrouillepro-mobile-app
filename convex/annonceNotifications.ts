import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireQueryUser } from "./publications";

// ── Queries ───────────────────────────────────────────────────────────────────

export const getForAnnonces = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireQueryUser(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "system"),
          q.eq(q.field("module"), "annonces"),
        ),
      )
      .order("desc")
      .take(50);
    return notifications;
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const createAnnonceNotification = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    actionPage: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("high"), v.literal("normal"), v.literal("low")),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "system", // car "annonce" n'existe pas encore
      module: "annonces", // champ requis dans le schéma
      title: args.title,
      body: args.body,
      read: false,
      pinned: false,
      actionPage: args.actionPage || "/annonces",
      priority: args.priority || "normal",
      // createdAt est automatiquement ajouté par Convex (_creationTime)
    });
    return { success: true };
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notif = await ctx.db.get(args.notificationId);
    if (!notif)
      throw new ConvexError({
        message: "Notification introuvable",
        code: "NOT_FOUND",
      });
    if (notif.userId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    await ctx.db.patch(args.notificationId, { read: true });
    return { success: true };
  },
});
