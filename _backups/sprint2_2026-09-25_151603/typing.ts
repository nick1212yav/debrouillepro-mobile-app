// convex/messages/typing.ts

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// SIGNALER QUE L'UTILISATEUR EST EN TRAIN D'ÉCRIRE
// ============================================================================

export const startTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier que l'utilisateur appartient à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    const now = Date.now();

    // ------------------------------------------------------------------------
    // Chercher un état de frappe existant
    // ------------------------------------------------------------------------

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();

    // ------------------------------------------------------------------------
    // Mettre à jour l'état existant
    // ------------------------------------------------------------------------

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: true,
        lastActiveAt: now,
      });

      return existing._id;
    }

    // ------------------------------------------------------------------------
    // Créer l'état de frappe
    // ------------------------------------------------------------------------

    return await ctx.db.insert("typingIndicators", {
      conversationId: args.conversationId,
      userId: user._id,
      isTyping: true,
      lastActiveAt: now,
    });
  },
});

// ============================================================================
// SIGNALER QUE L'UTILISATEUR A ARRÊTÉ D'ÉCRIRE
// ============================================================================

export const stopTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier l'appartenance à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", user._id),
      )
      .unique();

    if (!existing) {
      return null;
    }

    await ctx.db.patch(existing._id, {
      isTyping: false,
      lastActiveAt: Date.now(),
    });

    return existing._id;
  },
});

// ============================================================================
// RÉCUPÉRER LES UTILISATEURS QUI ÉCRIVENT
// ============================================================================

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier l'accès à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    // ------------------------------------------------------------------------
    // Récupérer les indicateurs actifs
    // ------------------------------------------------------------------------

    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const now = Date.now();

    // Un indicateur est considéré comme expiré après 5 secondes
    // sans nouvelle activité.
    const TYPING_TIMEOUT = 5000;

    const activeIndicators = indicators.filter(
      (indicator) =>
        indicator.userId !== user._id &&
        indicator.isTyping &&
        now - indicator.lastActiveAt <= TYPING_TIMEOUT,
    );

    // ------------------------------------------------------------------------
    // Charger les profils utilisateurs
    // ------------------------------------------------------------------------

    const users = [];

    for (const indicator of activeIndicators) {
      const typingUser = await ctx.db.get(indicator.userId);

      if (!typingUser) {
        continue;
      }

      users.push({
        userId: indicator.userId,
        name: typingUser.name,
        image: typingUser.avatar,
        lastActiveAt: indicator.lastActiveAt,
      });
    }

    return users;
  },
});

// ============================================================================
// VÉRIFIER SI UN UTILISATEUR EST EN TRAIN D'ÉCRIRE
// ============================================================================

export const isTyping = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.optional(v.id("users")),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier l'accès à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    const targetUserId = args.userId ?? user._id;

    const indicator = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", targetUserId),
      )
      .unique();

    if (!indicator || !indicator.isTyping) {
      return false;
    }

    const TYPING_TIMEOUT = 5000;

    return Date.now() - indicator.lastActiveAt <= TYPING_TIMEOUT;
  },
});

// ============================================================================
// NETTOYAGE DES INDICATEURS EXPIRÉS
// ============================================================================

export const cleanupExpired = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier l'accès à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const now = Date.now();
    const TYPING_TIMEOUT = 5000;

    let cleaned = 0;

    for (const indicator of indicators) {
      if (indicator.isTyping && now - indicator.lastActiveAt > TYPING_TIMEOUT) {
        await ctx.db.patch(indicator._id, {
          isTyping: false,
          lastActiveAt: now,
        });

        cleaned++;
      }
    }

    return {
      cleaned,
    };
  },
});
