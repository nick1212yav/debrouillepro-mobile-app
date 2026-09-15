// convex/messages/calls.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// TYPES
// ============================================================================

const callTypeValidator = v.union(v.literal("audio"), v.literal("video"));

const callStatusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("ended"),
  v.literal("missed"),
);

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Vérifie que l'utilisateur connecté est membre de la conversation.
 */
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

/**
 * Récupère un appel et vérifie que l'utilisateur peut y accéder.
 */
async function requireCallAccess(ctx: any, callId: any, userId: any) {
  const call = await ctx.db.get(callId);

  if (!call) {
    throw new Error("Appel introuvable");
  }

  await requireConversationMember(ctx, call.conversationId, userId);

  return call;
}

// ============================================================================
// DÉMARRER UN APPEL
// ============================================================================

export const startCall = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: callTypeValidator,
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier l'appartenance à la conversation
    // ------------------------------------------------------------------------

    await requireConversationMember(ctx, args.conversationId, user._id);

    // ------------------------------------------------------------------------
    // Vérifier qu'il n'y a pas déjà un appel actif
    // ------------------------------------------------------------------------

    const existingCalls = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const activeCall = existingCalls.find(
      (call) => call.status === "pending" || call.status === "active",
    );

    if (activeCall) {
      throw new Error("Un appel est déjà en cours dans cette conversation");
    }

    // ------------------------------------------------------------------------
    // Créer l'appel
    // ------------------------------------------------------------------------

    const now = new Date().toISOString();

    const callId = await ctx.db.insert("calls", {
      conversationId: args.conversationId,
      initiatedBy: user._id,
      type: args.type,
      status: "pending",
      startedAt: now,
    });

    return {
      callId,
      conversationId: args.conversationId,
      type: args.type,
      status: "pending",
      startedAt: now,
    };
  },
});

// ============================================================================
// ACCEPTER / REJOINDRE UN APPEL
// ============================================================================

export const answerCall = mutation({
  args: {
    callId: v.id("calls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const call = await requireCallAccess(ctx, args.callId, user._id);

    if (call.status === "ended") {
      throw new Error("Cet appel est déjà terminé");
    }

    if (call.status === "missed") {
      throw new Error("Cet appel est manqué");
    }

    if (call.status === "active") {
      return call;
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.callId, {
      status: "active",
      startedAt: call.startedAt || now,
    });

    return await ctx.db.get(args.callId);
  },
});

// ============================================================================
// REFUSER UN APPEL
// ============================================================================

export const rejectCall = mutation({
  args: {
    callId: v.id("calls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const call = await requireCallAccess(ctx, args.callId, user._id);

    if (call.status === "ended" || call.status === "missed") {
      return call;
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.callId, {
      status: "missed",
      endedAt: now,
    });

    return await ctx.db.get(args.callId);
  },
});

// ============================================================================
// TERMINER UN APPEL
// ============================================================================

export const endCall = mutation({
  args: {
    callId: v.id("calls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const call = await requireCallAccess(ctx, args.callId, user._id);

    if (call.status === "ended") {
      return call;
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.callId, {
      status: "ended",
      endedAt: now,
    });

    return await ctx.db.get(args.callId);
  },
});

// ============================================================================
// MARQUER UN APPEL COMME MANQUÉ
// ============================================================================

export const markAsMissed = mutation({
  args: {
    callId: v.id("calls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const call = await requireCallAccess(ctx, args.callId, user._id);

    if (call.status === "ended" || call.status === "missed") {
      return call;
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.callId, {
      status: "missed",
      endedAt: now,
    });

    return await ctx.db.get(args.callId);
  },
});

// ============================================================================
// RÉCUPÉRER UN APPEL
// ============================================================================

export const getCall = query({
  args: {
    callId: v.id("calls"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    return await requireCallAccess(ctx, args.callId, user._id);
  },
});

// ============================================================================
// RÉCUPÉRER L'APPEL ACTIF D'UNE CONVERSATION
// ============================================================================

export const getActiveCall = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const activeCall = calls
      .filter((call) => call.status === "pending" || call.status === "active")
      .sort((a, b) => {
        return b.startedAt.localeCompare(a.startedAt);
      })[0];

    if (!activeCall) {
      return null;
    }

    return {
      ...activeCall,
      isInitiator: activeCall.initiatedBy === user._id,
    };
  },
});

// ============================================================================
// LISTE DES APPELS D'UNE CONVERSATION
// ============================================================================

export const listConversationCalls = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const limit = Math.min(Math.max(args.limit ?? 30, 1), 100);

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const sortedCalls = calls
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);

    return Promise.all(
      sortedCalls.map(async (call) => {
        const initiator = await ctx.db.get(call.initiatedBy);

        return {
          ...call,
          initiator: initiator
            ? {
                _id: initiator._id,
                name: initiator.name,
                avatar: initiator.avatar,
              }
            : null,
        };
      }),
    );
  },
});

// ============================================================================
// LISTE DES APPELS D'UN UTILISATEUR
// ============================================================================

export const listMyCalls = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    const calls = await ctx.db.query("calls").collect();

    const myCalls = calls
      .filter((call) => call.initiatedBy === user._id)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);

    return myCalls;
  },
});

// ============================================================================
// SUPPRIMER UN APPEL DE L'HISTORIQUE
// ============================================================================
//
// IMPORTANT :
// On ne supprime pas le document "calls" de la base.
// On conserve l'historique serveur pour la cohérence et la sécurité.
//
// Cette fonction est volontairement absente de la V1.
// ============================================================================

// ============================================================================
// UTILITAIRE : TERMINER LES APPELS BLOQUÉS
// ============================================================================

export const cleanupStaleCalls = mutation({
  args: {
    conversationId: v.id("conversations"),
    timeoutMinutes: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    await requireConversationMember(ctx, args.conversationId, user._id);

    const timeoutMinutes = Math.min(Math.max(args.timeoutMinutes ?? 5, 1), 60);

    const timeoutMs = timeoutMinutes * 60 * 1000;
    const now = Date.now();

    const calls = await ctx.db
      .query("calls")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    let cleaned = 0;

    for (const call of calls) {
      if (call.status !== "pending" && call.status !== "active") {
        continue;
      }

      const startedAt = new Date(call.startedAt).getTime();

      if (Number.isNaN(startedAt) || now - startedAt < timeoutMs) {
        continue;
      }

      await ctx.db.patch(call._id, {
        status: call.status === "pending" ? "missed" : "ended",
        endedAt: new Date(now).toISOString(),
      });

      cleaned++;
    }

    return {
      cleaned,
    };
  },
});
