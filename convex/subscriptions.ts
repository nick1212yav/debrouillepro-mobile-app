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

// ── Get my current subscription ───────────────────────────────────────────────
export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    return sub ?? null;
  },
});

// ── Subscribe / upgrade plan ──────────────────────────────────────────────────
export const subscribeToPlan = mutation({
  args: {
    planId: v.union(v.literal("gratuit"), v.literal("pro"), v.literal("business")),
    billingCycle: v.union(v.literal("mensuel"), v.literal("annuel")),
    paymentMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = new Date();

    // Cancel any active subscription
    const existing = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    for (const s of existing) {
      if (s.status === "active") {
        await ctx.db.patch(s._id, { status: "cancelled", cancelledAt: now.toISOString() });
      }
    }

    if (args.planId === "gratuit") {
      // Just cancelling without a new paid plan
      return;
    }

    const months = args.billingCycle === "annuel" ? 12 : 1;
    const renewsAt = new Date(now);
    renewsAt.setMonth(renewsAt.getMonth() + months);

    return await ctx.db.insert("userSubscriptions", {
      userId: user._id,
      planId: args.planId,
      billingCycle: args.billingCycle,
      status: "active",
      startedAt: now.toISOString(),
      renewsAt: renewsAt.toISOString(),
      autoRenew: true,
      paymentMethod: args.paymentMethod ?? "Mobile Money",
    });
  },
});

// ── Cancel subscription ────────────────────────────────────────────────────────
export const cancelSubscription = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    if (!sub || sub.status !== "active")
      throw new ConvexError({ message: "Aucun abonnement actif", code: "NOT_FOUND" });
    await ctx.db.patch(sub._id, { status: "cancelled", cancelledAt: new Date().toISOString() });
  },
});

// ── Toggle auto-renew ─────────────────────────────────────────────────────────
export const toggleAutoRenew = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const sub = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    if (!sub || sub.status !== "active")
      throw new ConvexError({ message: "Aucun abonnement actif", code: "NOT_FOUND" });
    await ctx.db.patch(sub._id, { autoRenew: !sub.autoRenew });
  },
});
