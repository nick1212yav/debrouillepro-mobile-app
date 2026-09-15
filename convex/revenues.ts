import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Connexion requise" });
  const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
  return user;
}

// ─── Revenue Streams ──────────────────────────────────────────────────────────

export const getMyStreams = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("revenueStreams").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const upsertStream = mutation({
  args: {
    streamId: v.optional(v.id("revenueStreams")),
    source: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    frequency: v.union(v.literal("unique"), v.literal("hebdomadaire"), v.literal("mensuel"), v.literal("annuel")),
    lastReceivedAt: v.optional(v.string()),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { streamId, ...data } = args;
    if (streamId) {
      const s = await ctx.db.get(streamId);
      if (!s || s.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
      await ctx.db.patch(streamId, data);
      return streamId;
    }
    return ctx.db.insert("revenueStreams", { userId: user._id, ...data });
  },
});

export const deleteStream = mutation({
  args: { streamId: v.id("revenueStreams") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const s = await ctx.db.get(args.streamId);
    if (!s || s.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.streamId);
  },
});

// ─── Revenue Entries ──────────────────────────────────────────────────────────

export const getMyEntries = query({
  args: { fromDate: v.optional(v.string()), toDate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    const entries = await ctx.db.query("revenueEntries").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(100);
    if (!args.fromDate && !args.toDate) return entries;
    return entries.filter((e) => {
      if (args.fromDate && e.date < args.fromDate) return false;
      if (args.toDate && e.date > args.toDate) return false;
      return true;
    });
  },
});

export const addEntry = mutation({
  args: {
    streamId: v.optional(v.id("revenueStreams")),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    date: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // Update lastReceivedAt on stream
    if (args.streamId) {
      const stream = await ctx.db.get(args.streamId);
      if (stream && stream.userId === user._id) {
        await ctx.db.patch(args.streamId, { lastReceivedAt: args.date });
      }
    }
    return ctx.db.insert("revenueEntries", { userId: user._id, ...args });
  },
});

export const deleteEntry = mutation({
  args: { entryId: v.id("revenueEntries") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.entryId);
  },
});

export const getRevenueSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const [streams, entries] = await Promise.all([
      ctx.db.query("revenueStreams").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("revenueEntries").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
    ]);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthEntries = entries.filter((e) => e.date >= monthStart);
    const monthlyTotal = monthEntries.reduce((s, e) => s + e.amount, 0);
    const allTimeTotal = entries.reduce((s, e) => s + e.amount, 0);
    const activeStreamsMonthly = streams.filter((s) => s.active && s.frequency === "mensuel").reduce((sum, s) => sum + s.amount, 0);
    return { monthlyTotal, allTimeTotal, activeStreams: streams.filter((s) => s.active).length, projectedMonthly: activeStreamsMonthly };
  },
});
