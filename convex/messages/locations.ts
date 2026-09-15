// convex/messages/locations.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// HELPERS
// ============================================================================

async function requireConversationMember(
  ctx: any,
  conversationId: any,
  userId: any,
) {
  const member = await ctx.db
    .query("conversationMembers")
    .withIndex("by_user_and_conversation", (q: any) =>
      q.eq("userId", userId).eq("conversationId", conversationId),
    )
    .unique();

  if (!member) {
    throw new Error("Vous n'êtes pas membre de cette conversation");
  }

  return member;
}

async function requireLocationAccess(ctx: any, locationId: any, userId: any) {
  const location = await ctx.db.get(locationId);

  if (!location) {
    throw new Error("Localisation introuvable");
  }

  await requireConversationMember(ctx, location.conversationId, userId);

  return location;
}

// ============================================================================
// PARTAGER UNE LOCALISATION
// ============================================================================

export const shareLocation = mutation({
  args: {
    conversationId: v.id("conversations"),

    latitude: v.number(),
    longitude: v.number(),

    accuracy: v.optional(v.number()),
    altitude: v.optional(v.number()),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),

    address: v.optional(v.string()),
    placeName: v.optional(v.string()),

    messageId: v.optional(v.id("messages")),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    if (args.latitude < -90 || args.latitude > 90) {
      throw new Error("Latitude invalide");
    }

    if (args.longitude < -180 || args.longitude > 180) {
      throw new Error("Longitude invalide");
    }

    if (args.accuracy !== undefined && args.accuracy < 0) {
      throw new Error("La précision ne peut pas être négative");
    }

    const now = new Date().toISOString();

    const locationId = await ctx.db.insert("messageLocations", {
      conversationId: args.conversationId,
      userId: user._id,

      latitude: args.latitude,
      longitude: args.longitude,

      accuracy: args.accuracy,
      altitude: args.altitude,
      heading: args.heading,
      speed: args.speed,

      address: args.address?.trim() || undefined,
      placeName: args.placeName?.trim() || undefined,

      messageId: args.messageId,

      isLive: false,

      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(locationId);
  },
});

// ============================================================================
// PARTAGER UNE POSITION EN TEMPS RÉEL
// ============================================================================

export const startLiveLocation = mutation({
  args: {
    conversationId: v.id("conversations"),

    latitude: v.number(),
    longitude: v.number(),

    accuracy: v.optional(v.number()),
    altitude: v.optional(v.number()),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),

    address: v.optional(v.string()),
    placeName: v.optional(v.string()),

    durationMinutes: v.optional(v.number()),

    messageId: v.optional(v.id("messages")),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    if (args.latitude < -90 || args.latitude > 90) {
      throw new Error("Latitude invalide");
    }

    if (args.longitude < -180 || args.longitude > 180) {
      throw new Error("Longitude invalide");
    }

    const duration = args.durationMinutes ?? 60;

    if (duration < 1 || duration > 24 * 60) {
      throw new Error(
        "La durée doit être comprise entre 1 minute et 24 heures",
      );
    }

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + duration * 60 * 1000,
    ).toISOString();

    const nowIso = now.toISOString();

    // ------------------------------------------------------------------------
    // Arrêter les anciennes positions live de l'utilisateur
    // ------------------------------------------------------------------------

    const activeLocations = await ctx.db
      .query("messageLocations")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .collect();

    for (const location of activeLocations) {
      if (location.isLive) {
        await ctx.db.patch(location._id, {
          isLive: false,
          updatedAt: nowIso,
        });
      }
    }

    // ------------------------------------------------------------------------
    // Créer la nouvelle position live
    // ------------------------------------------------------------------------

    const locationId = await ctx.db.insert("messageLocations", {
      conversationId: args.conversationId,
      userId: user._id,

      latitude: args.latitude,
      longitude: args.longitude,

      accuracy: args.accuracy,
      altitude: args.altitude,
      heading: args.heading,
      speed: args.speed,

      address: args.address?.trim() || undefined,
      placeName: args.placeName?.trim() || undefined,

      messageId: args.messageId,

      isLive: true,
      expiresAt,

      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return await ctx.db.get(locationId);
  },
});

// ============================================================================
// METTRE À JOUR UNE POSITION LIVE
// ============================================================================

export const updateLiveLocation = mutation({
  args: {
    locationId: v.id("messageLocations"),

    latitude: v.number(),
    longitude: v.number(),

    accuracy: v.optional(v.number()),
    altitude: v.optional(v.number()),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),

    address: v.optional(v.string()),
    placeName: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const location = await requireLocationAccess(
      ctx,
      args.locationId,
      user._id,
    );

    if (location.userId !== user._id) {
      throw new Error("Vous ne pouvez pas modifier cette localisation");
    }

    if (!location.isLive) {
      throw new Error("Cette localisation live est inactive");
    }

    if (
      location.expiresAt &&
      new Date(location.expiresAt).getTime() <= Date.now()
    ) {
      await ctx.db.patch(location._id, {
        isLive: false,
        updatedAt: new Date().toISOString(),
      });

      throw new Error("Cette localisation live a expiré");
    }

    if (args.latitude < -90 || args.latitude > 90) {
      throw new Error("Latitude invalide");
    }

    if (args.longitude < -180 || args.longitude > 180) {
      throw new Error("Longitude invalide");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.locationId, {
      latitude: args.latitude,
      longitude: args.longitude,

      accuracy: args.accuracy,
      altitude: args.altitude,
      heading: args.heading,
      speed: args.speed,

      address: args.address?.trim() || undefined,

      placeName: args.placeName?.trim() || undefined,

      updatedAt: now,
    });

    return await ctx.db.get(args.locationId);
  },
});

// ============================================================================
// ARRÊTER UNE POSITION LIVE
// ============================================================================

export const stopLiveLocation = mutation({
  args: {
    locationId: v.id("messageLocations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const location = await requireLocationAccess(
      ctx,
      args.locationId,
      user._id,
    );

    if (location.userId !== user._id) {
      throw new Error("Vous ne pouvez pas arrêter cette localisation");
    }

    await ctx.db.patch(args.locationId, {
      isLive: false,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
    };
  },
});

// ============================================================================
// RÉCUPÉRER UNE LOCALISATION
// ============================================================================

export const getLocation = query({
  args: {
    locationId: v.id("messageLocations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const location = await requireLocationAccess(
      ctx,
      args.locationId,
      user._id,
    );

    const expired =
      !!location.expiresAt &&
      new Date(location.expiresAt).getTime() <= Date.now();

    return {
      ...location,

      isLive: location.isLive && !expired,

      expired,
    };
  },
});

// ============================================================================
// LOCALISATIONS D'UNE CONVERSATION
// ============================================================================

export const listConversationLocations = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    const locations = await ctx.db
      .query("messageLocations")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return locations
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((location) => ({
        ...location,

        isLive:
          location.isLive &&
          (!location.expiresAt ||
            new Date(location.expiresAt).getTime() > Date.now()),
      }));
  },
});

// ============================================================================
// POSITIONS LIVE ACTIVES
// ============================================================================

export const getActiveLiveLocations = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const locations = await ctx.db
      .query("messageLocations")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const now = Date.now();

    return locations.filter(
      (location) =>
        location.isLive &&
        (!location.expiresAt || new Date(location.expiresAt).getTime() > now),
    );
  },
});

// ============================================================================
// MES POSITIONS LIVE
// ============================================================================

export const getMyActiveLiveLocation = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const locations = await ctx.db
      .query("messageLocations")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .collect();

    const now = Date.now();

    const active = locations
      .filter(
        (location) =>
          location.isLive &&
          (!location.expiresAt || new Date(location.expiresAt).getTime() > now),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return active[0] ?? null;
  },
});

// ============================================================================
// ARRÊTER TOUTES MES POSITIONS LIVE
// ============================================================================

export const stopAllMyLiveLocations = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const locations = await ctx.db
      .query("messageLocations")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .collect();

    const now = new Date().toISOString();

    let stopped = 0;

    for (const location of locations) {
      if (location.isLive) {
        await ctx.db.patch(location._id, {
          isLive: false,
          updatedAt: now,
        });

        stopped++;
      }
    }

    return {
      success: true,
      stopped,
    };
  },
});

// ============================================================================
// SUPPRIMER UNE LOCALISATION
// ============================================================================

export const deleteLocation = mutation({
  args: {
    locationId: v.id("messageLocations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const location = await requireLocationAccess(
      ctx,
      args.locationId,
      user._id,
    );

    if (location.userId !== user._id) {
      throw new Error("Vous ne pouvez pas supprimer cette localisation");
    }

    await ctx.db.delete(args.locationId);

    return {
      success: true,
    };
  },
});
