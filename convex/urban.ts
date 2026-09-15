import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

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

// ── Eco Actions (Environnement) ───────────────────────────────────────────────

export const getEcoProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    return await ctx.db
      .query("ecoProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const toggleEcoAction = mutation({
  args: { actionId: v.string(), points: v.number(), done: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("ecoProgress")
      .withIndex("by_user_action", (q) =>
        q.eq("userId", user._id).eq("actionId", args.actionId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { done: args.done });
    } else {
      await ctx.db.insert("ecoProgress", {
        userId: user._id,
        actionId: args.actionId,
        points: args.points,
        done: args.done,
      });
    }
  },
});

// ── Permits (Urbanisme) ───────────────────────────────────────────────────────

export const listMyPermits = query({
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
      .query("urbanPermits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const submitPermit = mutation({
  args: {
    type: v.string(),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const id = `PC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    return await ctx.db.insert("urbanPermits", {
      userId: user._id,
      permitId: id,
      type: args.type,
      address: args.address,
      status: "En attente",
      date: new Date().toLocaleDateString("fr-FR"),
    });
  },
});

// ── Energy Settings (Énergie) ─────────────────────────────────────────────────

export const getEnergySettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    return await ctx.db
      .query("energySettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const saveEnergySettings = mutation({
  args: { autoSave: v.boolean(), solarAlerts: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("energySettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { autoSave: args.autoSave, solarAlerts: args.solarAlerts });
    } else {
      await ctx.db.insert("energySettings", {
        userId: user._id,
        autoSave: args.autoSave,
        solarAlerts: args.solarAlerts,
      });
    }
  },
});

// ── Housing Favorites & Visit Bookings (Logement) ────────────────────────────

export const getHousingData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { favorites: [], bookings: [] };
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return { favorites: [], bookings: [] };
    const favorites = await ctx.db
      .query("housingFavorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const bookings = await ctx.db
      .query("visitBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    return { favorites: favorites.map((f) => f.listingId), bookings: bookings.map((b) => b.listingId) };
  },
});

export const toggleHousingFavorite = mutation({
  args: { listingId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("housingFavorites")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", user._id).eq("listingId", args.listingId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("housingFavorites", { userId: user._id, listingId: args.listingId });
    }
  },
});

export const toggleVisitBooking = mutation({
  args: { listingId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("visitBookings")
      .withIndex("by_user_listing", (q) =>
        q.eq("userId", user._id).eq("listingId", args.listingId)
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("visitBookings", { userId: user._id, listingId: args.listingId });
      return true;
    }
  },
});
