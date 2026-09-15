import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ── Helper ───────────────────────────────────────────────────────────────────
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

// Generate a referral code for the current user (deterministic from user _id)
function generateCode(userId: string): string {
  const suffix = userId.slice(-6).toUpperCase();
  return `REF-${suffix}`;
}

// ── Get my referral stats ─────────────────────────────────────────────────────
export const getMyReferralStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    const code = generateCode(user._id);
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", user._id))
      .collect();

    const activeCount = referrals.filter((r) => r.status === "rewarded" || r.status === "validated").length;
    const pendingCount = referrals.filter((r) => r.status === "pending").length;
    const totalEarned = referrals
      .filter((r) => r.status === "rewarded")
      .reduce((s, r) => s + (r.rewardAmount ?? 0), 0);
    const pendingEarned = referrals
      .filter((r) => r.status === "pending" || r.status === "validated")
      .reduce((s, r) => s + (r.rewardAmount ?? 500), 0);

    return { code, referrals, activeCount, pendingCount, totalEarned, pendingEarned };
  },
});

// ── Use a referral code (called when a new user registers) ────────────────────
export const useReferralCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Find referrer by code
    const allUsers = await ctx.db.query("users").collect();
    const referrer = allUsers.find((u) => generateCode(u._id) === args.code.toUpperCase());
    if (!referrer) throw new ConvexError({ message: "Code invalide", code: "NOT_FOUND" });
    if (referrer._id === user._id) throw new ConvexError({ message: "Vous ne pouvez pas vous parrainer vous-même", code: "BAD_REQUEST" });

    // Check not already referred
    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_referred", (q) => q.eq("referredId", user._id))
      .first();
    if (existing) throw new ConvexError({ message: "Vous avez déjà utilisé un code de parrainage", code: "CONFLICT" });

    await ctx.db.insert("referrals", {
      referrerId: referrer._id,
      referredId: user._id,
      code: args.code.toUpperCase(),
      status: "pending",
      rewardAmount: 500,
      rewardCurrency: "FCFA",
    });
  },
});
