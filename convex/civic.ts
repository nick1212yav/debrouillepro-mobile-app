import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

// ── Auth helper ────────────────────────────────────────────────────────────
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

// ── Justice reports ────────────────────────────────────────────────────────
export const listMyJusticeReports = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("justiceReports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const createJusticeReport = mutation({
  args: {
    type: v.string(),
    description: v.string(),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("justiceReports", {
      userId: user._id,
      type: args.type,
      description: args.description,
      location: args.location,
      status: "En cours",
    });
  },
});

// ── Security incidents ─────────────────────────────────────────────────────
export const listRecentIncidents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("securityIncidents")
      .order("desc")
      .take(30);
  },
});

export const listMyIncidents = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("securityIncidents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(30);
  },
});

export const createSecurityIncident = mutation({
  args: {
    type: v.string(),
    location: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("securityIncidents", {
      userId: user._id,
      type: args.type,
      location: args.location,
      severity: args.severity,
      status: "Signalé",
    });
  },
});

// ── Data alerts ────────────────────────────────────────────────────────────
export const listMyDataAlerts = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("dataAlerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const toggleDataAlert = mutation({
  args: { datasetId: v.number(), datasetName: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("dataAlerts")
      .withIndex("by_user_dataset", (q) =>
        q.eq("userId", user._id).eq("datasetId", args.datasetId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("dataAlerts", {
        userId: user._id,
        datasetId: args.datasetId,
        datasetName: args.datasetName,
      });
      return true;
    }
  },
});
