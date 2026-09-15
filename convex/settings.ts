import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
}

export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) return null;
    return ctx.db.query("userSettings").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
  },
});

export const upsertSettings = mutation({
  args: {
    notifications: v.optional(v.boolean()),
    offlineMode: v.optional(v.boolean()),
    biometrics: v.optional(v.boolean()),
    jobAlerts: v.optional(v.boolean()),
    immoAlerts: v.optional(v.boolean()),
    paymentAlerts: v.optional(v.boolean()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
    const existing = await ctx.db.query("userSettings").withIndex("by_user", (q) => q.eq("userId", user._id)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: new Date().toISOString() });
    } else {
      await ctx.db.insert("userSettings", {
        userId: user._id,
        notifications: true,
        offlineMode: false,
        biometrics: false,
        jobAlerts: true,
        immoAlerts: false,
        paymentAlerts: true,
        language: "Français",
        ...args,
        updatedAt: new Date().toISOString(),
      });
    }
  },
});
