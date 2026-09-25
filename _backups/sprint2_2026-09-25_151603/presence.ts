// convex/messages/presence.ts

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// METTRE À JOUR LA PRÉSENCE
// ============================================================================

export const setPresence = mutation({
  args: {
    status: v.union(
      v.literal("online"),
      v.literal("away"),
      v.literal("offline"),
    ),
    device: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        lastSeen: now,
        device: args.device,
      });

      return existing._id;
    }

    return await ctx.db.insert("presence", {
      userId: user._id,
      status: args.status,
      lastSeen: now,
      device: args.device,
    });
  },
});

// ============================================================================
// PASSER EN LIGNE
// ============================================================================

export const goOnline = mutation({
  args: {
    device: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "online",
        lastSeen: now,
        device: args.device,
      });

      return existing._id;
    }

    return await ctx.db.insert("presence", {
      userId: user._id,
      status: "online",
      lastSeen: now,
      device: args.device,
    });
  },
});

// ============================================================================
// PASSER EN ABSENT
// ============================================================================

export const goAway = mutation({
  args: {
    device: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "away",
        lastSeen: now,
        device: args.device,
      });

      return existing._id;
    }

    return await ctx.db.insert("presence", {
      userId: user._id,
      status: "away",
      lastSeen: now,
      device: args.device,
    });
  },
});

// ============================================================================
// PASSER HORS LIGNE
// ============================================================================

export const goOffline = mutation({
  handler: async (ctx) => {
    const user = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!existing) {
      return null;
    }

    await ctx.db.patch(existing._id, {
      status: "offline",
      lastSeen: new Date().toISOString(),
    });

    return existing._id;
  },
});

// ============================================================================
// HEARTBEAT
//
// À appeler régulièrement lorsque l'utilisateur est actif.
// Cela permet de maintenir lastSeen à jour sans recréer la présence.
// ============================================================================

export const heartbeat = mutation({
  args: {
    device: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const now = new Date().toISOString();

    if (!existing) {
      return await ctx.db.insert("presence", {
        userId: user._id,
        status: "online",
        lastSeen: now,
        device: args.device,
      });
    }

    await ctx.db.patch(existing._id, {
      status: "online",
      lastSeen: now,
      device: args.device,
    });

    return existing._id;
  },
});

// ============================================================================
// RÉCUPÉRER LA PRÉSENCE D'UN UTILISATEUR
// ============================================================================

export const getPresence = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!presence) {
      return {
        userId: args.userId,
        status: "offline" as const,
        lastSeen: null,
        device: null,
      };
    }

    return presence;
  },
});

// ============================================================================
// RÉCUPÉRER LA PRÉSENCE DE PLUSIEURS UTILISATEURS
// ============================================================================

export const getUsersPresence = query({
  args: {
    userIds: v.array(v.id("users")),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const uniqueUserIds = [...new Set(args.userIds.map((id) => id.toString()))];

    const results = [];

    for (const userIdString of uniqueUserIds) {
      const userId = args.userIds.find((id) => id.toString() === userIdString);

      if (!userId) continue;

      const presence = await ctx.db
        .query("presence")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      results.push(
        presence ?? {
          userId,
          status: "offline" as const,
          lastSeen: null,
          device: null,
        },
      );
    }

    return results;
  },
});
