import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Helper ──────────────────────────────────────────────────────────────────

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

// ─── Travel Plans (Planificateur + Carnet) ───────────────────────────────────

export const listMyTravelPlans = query({
  args: {},
  handler: async (ctx): Promise<Array<{
    _id: Id<"travelPlans">;
    _creationTime: number;
    userId: Id<"users">;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    totalBudget?: number;
    currency?: string;
    notes?: string;
    coverImage?: string;
    status: "draft" | "confirmed" | "completed";
    entriesCount: number;
    expensesTotal: number;
  }>> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const plans = await ctx.db.query("travelPlans").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").collect();
    return await Promise.all(plans.map(async (plan) => {
      const entries = await ctx.db.query("travelEntries").withIndex("by_plan", (q) => q.eq("planId", plan._id)).collect();
      const expenses = await ctx.db.query("travelExpenses").withIndex("by_plan", (q) => q.eq("planId", plan._id)).collect();
      const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
      return { ...plan, entriesCount: entries.length, expensesTotal };
    }));
  },
});

export const createTravelPlan = mutation({
  args: {
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    travelers: v.number(),
    totalBudget: v.optional(v.number()),
    currency: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"travelPlans">> => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("travelPlans", {
      userId: user._id,
      title: args.title,
      destination: args.destination,
      startDate: args.startDate,
      endDate: args.endDate,
      travelers: args.travelers,
      totalBudget: args.totalBudget,
      currency: args.currency ?? "EUR",
      coverImage: args.coverImage,
      status: "draft",
    });
  },
});

export const getTravelPlan = query({
  args: { planId: v.id("travelPlans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db.get(args.planId);
  },
});

// ─── Travel Entries (Carnet de voyage) ───────────────────────────────────────

export const listJournalEntries = query({
  args: { planId: v.optional(v.id("travelPlans")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    if (args.planId) {
      return await ctx.db.query("travelEntries").withIndex("by_plan", (q) => q.eq("planId", args.planId!)).order("desc").collect();
    }
    // All entries for the user (across plans)
    const plans = await ctx.db.query("travelPlans").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    const allEntries = await Promise.all(
      plans.map((p) => ctx.db.query("travelEntries").withIndex("by_plan", (q) => q.eq("planId", p._id)).order("desc").collect())
    );
    return allEntries.flat().sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const createJournalEntry = mutation({
  args: {
    planId: v.id("travelPlans"),
    title: v.string(),
    content: v.string(),
    date: v.string(),
    location: v.optional(v.string()),
    mood: v.optional(v.string()),
    images: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"travelEntries">> => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("travelEntries", {
      planId: args.planId,
      userId: user._id,
      title: args.title,
      content: args.content,
      date: args.date,
      location: args.location,
      mood: args.mood,
      images: args.images,
    });
  },
});

// ─── Travel Expenses (Budget Voyage) ─────────────────────────────────────────

export const listTravelExpenses = query({
  args: { planId: v.id("travelPlans") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db.query("travelExpenses").withIndex("by_plan", (q) => q.eq("planId", args.planId)).order("desc").collect();
  },
});

export const addTravelExpense = mutation({
  args: {
    planId: v.id("travelPlans"),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"travelExpenses">> => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("travelExpenses", {
      planId: args.planId,
      userId: user._id,
      category: args.category,
      description: args.description,
      amount: args.amount,
      currency: args.currency,
      date: args.date,
    });
  },
});

export const getTravelStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { countries: 0, days: 0, entries: 0, plans: 0 };
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return { countries: 0, days: 0, entries: 0, plans: 0 };
    const plans = await ctx.db.query("travelPlans").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    const allEntries = await Promise.all(
      plans.map((p) => ctx.db.query("travelEntries").withIndex("by_plan", (q) => q.eq("planId", p._id)).collect())
    );
    const entries = allEntries.flat();
    const days = plans.reduce((acc, p) => {
      const start = new Date(p.startDate).getTime();
      const end = new Date(p.endDate).getTime();
      return acc + Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }, 0);
    const countries = new Set(plans.map((p) => p.destination.split(",").pop()?.trim() ?? p.destination)).size;
    return { countries, days, entries: entries.length, plans: plans.length };
  },
});

// ─── Bucket list (using localStorage on frontend – no backend needed) ─────────
// Destinations are static/curated, bucket list stored per-device is acceptable.
// We persist travel plans as the main Convex-backed feature.
