import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });
  return user;
}

export const listMyTrackedItems = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("trackingItems")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const addTrackingItem = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("colis"), v.literal("vehicule"), v.literal("appareil"), v.literal("autre")),
    trackingId: v.string(),
    status: v.string(),
    location: v.optional(v.string()),
    progress: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = new Date().toISOString();
    return await ctx.db.insert("trackingItems", {
      userId: user._id,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTrackingItem = mutation({
  args: {
    itemId: v.id("trackingItems"),
    status: v.optional(v.string()),
    location: v.optional(v.string()),
    progress: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    const { itemId, ...updates } = args;
    await ctx.db.patch(itemId, { ...updates, updatedAt: new Date().toISOString() });
  },
});

export const deleteTrackingItem = mutation({
  args: { itemId: v.id("trackingItems") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item || item.userId !== user._id)
      throw new ConvexError({ message: "Non autorisé", code: "FORBIDDEN" });
    await ctx.db.delete(args.itemId);
  },
});
