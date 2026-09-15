// convex/locations.ts

import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

async function requireConversationParticipant(
  ctx: any,
  conversationId: any,
  userId: any,
) {
  const conversation = await ctx.db.get(conversationId);

  if (!conversation) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Conversation introuvable",
    });
  }

  if (!conversation.participantIds.includes(userId)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous ne faites pas partie de cette conversation",
    });
  }

  return conversation;
}

/**
 * Envoie un emplacement fixe.
 */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),

    latitude: v.number(),

    longitude: v.number(),

    accuracy: v.optional(v.number()),

    altitude: v.optional(v.union(v.number(), v.null())),

    heading: v.optional(v.union(v.number(), v.null())),

    speed: v.optional(v.union(v.number(), v.null())),

    label: v.optional(v.string()),

    address: v.optional(v.string()),

    city: v.optional(v.string()),

    country: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const conversation = await requireConversationParticipant(
      ctx,
      args.conversationId,
      user._id,
    );

    if (
      args.latitude < -90 ||
      args.latitude > 90 ||
      args.longitude < -180 ||
      args.longitude > 180
    ) {
      throw new ConvexError({
        code: "INVALID_LOCATION",
        message: "Coordonnées GPS invalides",
      });
    }

    const text = args.label?.trim()
      ? `📍 ${args.label.trim()}`
      : "📍 Emplacement partagé";

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,

      senderId: user._id,

      text,

      type: "location",

      status: "sent",

      reactions: [],

      metadata: {
        type: "location",

        mode: "current",

        latitude: args.latitude,

        longitude: args.longitude,

        accuracy: args.accuracy,

        altitude: args.altitude,

        heading: args.heading,

        speed: args.speed,

        label: args.label,

        address: args.address,

        city: args.city,

        country: args.country,

        isActive: false,
      },
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageText: text,

      lastMessageSenderId: user._id,

      updatedAt: new Date().toISOString(),
    });

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    await Promise.all(
      members
        .filter((member: any) => member.userId !== user._id)
        .map((member: any) =>
          ctx.db.patch(member._id, {
            unreadCount: member.unreadCount + 1,
          }),
        ),
    );

    return messageId;
  },
});

/**
 * Démarre une localisation Live.
 */
export const startLive = mutation({
  args: {
    conversationId: v.id("conversations"),

    latitude: v.number(),

    longitude: v.number(),

    accuracy: v.optional(v.number()),

    altitude: v.optional(v.union(v.number(), v.null())),

    heading: v.optional(v.union(v.number(), v.null())),

    speed: v.optional(v.union(v.number(), v.null())),

    durationMinutes: v.optional(v.number()),

    label: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireConversationParticipant(ctx, args.conversationId, user._id);

    if (
      args.latitude < -90 ||
      args.latitude > 90 ||
      args.longitude < -180 ||
      args.longitude > 180
    ) {
      throw new ConvexError({
        code: "INVALID_LOCATION",
        message: "Coordonnées GPS invalides",
      });
    }

    const durationMinutes = Math.min(
      Math.max(args.durationMinutes ?? 15, 1),
      120,
    );

    const now = Date.now();

    const expiresAt = now + durationMinutes * 60 * 1000;

    const trackingId = `${user._id}:${now}`;

    const text = args.label?.trim()
      ? `📡 ${args.label.trim()}`
      : "📡 Position en direct";

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,

      senderId: user._id,

      text,

      type: "location",

      status: "sent",

      reactions: [],

      metadata: {
        type: "location",

        mode: "live",

        latitude: args.latitude,

        longitude: args.longitude,

        accuracy: args.accuracy,

        altitude: args.altitude,

        heading: args.heading,

        speed: args.speed,

        label: args.label,

        trackingId,

        startedAt: now,

        expiresAt,

        isActive: true,
      },
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageText: text,

      lastMessageSenderId: user._id,

      updatedAt: new Date().toISOString(),
    });

    return messageId;
  },
});

/**
 * Met à jour une localisation Live.
 */
export const updateLive = mutation({
  args: {
    messageId: v.id("messages"),

    latitude: v.number(),

    longitude: v.number(),

    accuracy: v.optional(v.number()),

    altitude: v.optional(v.union(v.number(), v.null())),

    heading: v.optional(v.union(v.number(), v.null())),

    speed: v.optional(v.union(v.number(), v.null())),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    if (message.senderId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas modifier cette localisation",
      });
    }

    if (message.type !== "location") {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: "Ce message n'est pas une localisation",
      });
    }

    const metadata = (message.metadata ?? {}) as Record<string, any>;

    if (metadata.mode !== "live") {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: "Cette localisation n'est pas en direct",
      });
    }

    if (metadata.isActive === false) {
      return message._id;
    }

    if (metadata.expiresAt && Date.now() >= metadata.expiresAt) {
      await ctx.db.patch(message._id, {
        metadata: {
          ...metadata,

          isActive: false,
        },
      });

      return message._id;
    }

    await ctx.db.patch(message._id, {
      metadata: {
        ...metadata,

        latitude: args.latitude,

        longitude: args.longitude,

        accuracy: args.accuracy,

        altitude: args.altitude,

        heading: args.heading,

        speed: args.speed,

        isActive: true,
      },
    });

    return message._id;
  },
});

/**
 * Arrête une localisation Live.
 */
export const stopLive = mutation({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    if (message.senderId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas arrêter cette localisation",
      });
    }

    if (message.type !== "location") {
      throw new ConvexError({
        code: "INVALID_MESSAGE",
        message: "Ce message n'est pas une localisation",
      });
    }

    const metadata = (message.metadata ?? {}) as Record<string, any>;

    await ctx.db.patch(message._id, {
      metadata: {
        ...metadata,

        isActive: false,

        stoppedAt: Date.now(),
      },
    });

    return message._id;
  },
});

/**
 * Récupère l'état actuel d'une localisation Live.
 *
 * Comme il s'agit d'une query Convex,
 * tous les participants voient automatiquement
 * les changements.
 */
export const getLive = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);

    if (!message) {
      return null;
    }

    if (message.type !== "location") {
      return null;
    }

    const metadata = (message.metadata ?? {}) as Record<string, any>;

    if (metadata.mode !== "live") {
      return null;
    }

    /**
     * On ne modifie pas la DB dans une query.
     * On expose simplement l'état calculé.
     */
    const expired =
      metadata.expiresAt !== undefined && Date.now() >= metadata.expiresAt;

    return {
      ...message,

      metadata: {
        ...metadata,

        isActive: expired ? false : (metadata.isActive ?? false),
      },
    };
  },
});
