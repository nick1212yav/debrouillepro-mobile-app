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

// ──────────────────────────────────────────────────────────────────────
// AGENDA
// ──────────────────────────────────────────────────────────────────────

export const listMyAgendaEvents = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("agendaEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const createAgendaEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.string(),
    endTime: v.string(),
    category: v.union(
      v.literal("Personnel"), v.literal("Travail"),
      v.literal("Santé"), v.literal("Communauté"),
    ),
    color: v.string(),
    note: v.optional(v.string()),
    reminder: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("agendaEvents", { userId: user._id, ...args });
  },
});

export const updateAgendaEvent = mutation({
  args: {
    id: v.id("agendaEvents"),
    title: v.optional(v.string()),
    date: v.optional(v.string()),
    time: v.optional(v.string()),
    endTime: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("Personnel"), v.literal("Travail"),
      v.literal("Santé"), v.literal("Communauté"),
    )),
    color: v.optional(v.string()),
    note: v.optional(v.string()),
    reminder: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const evt = await ctx.db.get(args.id);
    if (!evt || evt.userId !== user._id) throw new ConvexError({ message: "Introuvable", code: "NOT_FOUND" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteAgendaEvent = mutation({
  args: { id: v.id("agendaEvents") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const evt = await ctx.db.get(args.id);
    if (!evt || evt.userId !== user._id) throw new ConvexError({ message: "Introuvable", code: "NOT_FOUND" });
    await ctx.db.delete(args.id);
  },
});

// ──────────────────────────────────────────────────────────────────────
// COFFRE-FORT DOCUMENTS
// ──────────────────────────────────────────────────────────────────────

export const listMyVaultDocs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("vaultDocuments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const createVaultDoc = mutation({
  args: {
    name: v.string(),
    category: v.union(
      v.literal("Identité"), v.literal("Santé"),
      v.literal("Finances"), v.literal("Emploi"), v.literal("Autres"),
    ),
    reference: v.optional(v.string()),
    expiry: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("vaultDocuments", { userId: user._id, ...args });
  },
});

export const updateVaultDoc = mutation({
  args: {
    id: v.id("vaultDocuments"),
    name: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("Identité"), v.literal("Santé"),
      v.literal("Finances"), v.literal("Emploi"), v.literal("Autres"),
    )),
    reference: v.optional(v.string()),
    expiry: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== user._id) throw new ConvexError({ message: "Introuvable", code: "NOT_FOUND" });
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const deleteVaultDoc = mutation({
  args: { id: v.id("vaultDocuments") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== user._id) throw new ConvexError({ message: "Introuvable", code: "NOT_FOUND" });
    await ctx.db.delete(args.id);
  },
});

// ──────────────────────────────────────────────────────────────────────
// SOS – EMERGENCY CONTACTS
// ──────────────────────────────────────────────────────────────────────

export const listEmergencyContacts = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return ctx.db
      .query("emergencyContacts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const addEmergencyContact = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    relation: v.string(),
    isPrimary: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("emergencyContacts", { userId: user._id, ...args });
  },
});

export const deleteEmergencyContact = mutation({
  args: { id: v.id("emergencyContacts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact || contact.userId !== user._id) throw new ConvexError({ message: "Introuvable", code: "NOT_FOUND" });
    await ctx.db.delete(args.id);
  },
});

// ──────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ──────────────────────────────────────────────────────────────────────

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const uid = user._id;

    const [badges, xpLog, publications, agendaEvents] = await Promise.all([
      ctx.db.query("userBadges").withIndex("by_user", (q) => q.eq("userId", uid)).collect(),
      ctx.db.query("xpLog").withIndex("by_user", (q) => q.eq("userId", uid)).collect(),
      ctx.db.query("publications").withIndex("by_author", (q) => q.eq("authorId", uid)).collect(),
      ctx.db.query("agendaEvents").withIndex("by_user", (q) => q.eq("userId", uid)).collect(),
    ]);

    const totalXp = xpLog.reduce((sum, x) => sum + x.amount, 0);
    const level = Math.floor(totalXp / 1000) + 1;

    return {
      totalXp,
      level,
      xpForNextLevel: level * 1000,
      badgeCount: badges.length,
      publicationCount: publications.length,
      agendaEventCount: agendaEvents.length,
    };
  },
});

/** Data for the Rewards page: totalXp, badges, and xpLog history */
export const getUserRewardsData = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const uid = user._id;

    const [badges, xpLog] = await Promise.all([
      ctx.db.query("userBadges").withIndex("by_user", (q) => q.eq("userId", uid)).collect(),
      ctx.db.query("xpLog").withIndex("by_user", (q) => q.eq("userId", uid)).order("desc").take(50),
    ]);

    const totalXp = xpLog.reduce((sum, x) => sum + x.amount, 0);

    // If we only took the last 50 for history but need full total, re-query all for sum
    let fullTotalXp = totalXp;
    if (xpLog.length === 50) {
      const allXp = await ctx.db.query("xpLog").withIndex("by_user", (q) => q.eq("userId", uid)).collect();
      fullTotalXp = allXp.reduce((sum, x) => sum + x.amount, 0);
    }

    return {
      totalXp: fullTotalXp,
      badgeCount: badges.length,
      badges: badges.map((b) => ({ badgeId: b.badgeId, unlockedAt: b.unlockedAt })),
      xpHistory: xpLog.map((x) => ({
        id: x._id,
        amount: x.amount,
        reason: x.reason,
        sourceType: x.sourceType,
        createdAt: new Date(x._creationTime).toISOString(),
      })),
    };
  },
});

/** Top 10 users by XP for leaderboard */
export const getLeaderboard = query({
  args: {},
  handler: async (ctx): Promise<Array<{ userId: string; name: string; avatar: string | undefined; totalXp: number; level: number; rank: number }>> => {
    // Collect all xpLog entries grouped by user
    const allXp = await ctx.db.query("xpLog").collect();
    const byUser: Record<string, number> = {};
    for (const x of allXp) {
      byUser[x.userId] = (byUser[x.userId] ?? 0) + x.amount;
    }
    // Sort and take top 10
    const sorted = Object.entries(byUser)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      const [userId, totalXp] = sorted[i];
      const user = await ctx.db.get(userId as Parameters<typeof ctx.db.get>[0]);
      if (!user || !("tokenIdentifier" in user)) continue;
      result.push({
        userId,
        name: user.name ?? "Utilisateur",
        avatar: user.avatar,
        totalXp,
        level: Math.floor(totalXp / 1000) + 1,
        rank: i + 1,
      });
    }
    return result;
  },
});
