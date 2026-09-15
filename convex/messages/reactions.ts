// convex/messages/reactions.ts

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      message: "Utilisateur non authentifié",
      code: "UNAUTHENTICATED",
    });
  }

  const tokenIdentifier = identity.tokenIdentifier;

  if (!tokenIdentifier) {
    throw new ConvexError({
      message: "Identifiant d'authentification manquant",
      code: "AUTH_TOKEN_IDENTIFIER_MISSING",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "USER_NOT_FOUND",
    });
  }

  return user;
}

// ============================================================================
// MESSAGE ACCESS
// ============================================================================

/**
 * Vérifie que le message existe et que l'utilisateur connecté
 * appartient bien à la conversation du message.
 */
async function requireMessageAccess(ctx: any, messageId: Id<"messages">) {
  const user = await getCurrentUser(ctx);

  const message = await ctx.db.get(messageId);

  if (!message) {
    throw new ConvexError({
      message: "Message introuvable",
      code: "MESSAGE_NOT_FOUND",
    });
  }

  const conversation = await ctx.db.get(message.conversationId);

  if (!conversation) {
    throw new ConvexError({
      message: "Conversation introuvable",
      code: "CONVERSATION_NOT_FOUND",
    });
  }

  const member = await ctx.db
    .query("conversationMembers")
    .withIndex("by_user_and_conversation", (q: any) =>
      q.eq("userId", user._id).eq("conversationId", message.conversationId),
    )
    .unique();

  const isParticipant = conversation.participantIds.some(
    (participantId: Id<"users">) => participantId === user._id,
  );

  if (!member && !isParticipant) {
    throw new ConvexError({
      message: "Vous ne faites pas partie de cette conversation",
      code: "FORBIDDEN",
    });
  }

  return {
    user,
    message,
    conversation,
  };
}

// ============================================================================
// NORMALIZE EMOJI
// ============================================================================

function normalizeEmoji(emoji: string): string {
  return emoji.trim();
}

// ============================================================================
// ADD REACTION
// ============================================================================

/**
 * Ajoute une réaction à un message.
 *
 * Si l'emoji existe déjà :
 *   count + 1
 *
 * Sinon :
 *   création de la réaction avec count = 1
 *
 * Structure utilisée :
 *
 * reactions: [
 *   { emoji: "❤️", count: 3 },
 *   { emoji: "😂", count: 2 }
 * ]
 */
export const reactToMessage = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },

  handler: async (ctx, args) => {
    const emoji = normalizeEmoji(args.emoji);

    if (!emoji) {
      throw new ConvexError({
        message: "Emoji invalide",
        code: "INVALID_EMOJI",
      });
    }

    const { message } = await requireMessageAccess(ctx, args.messageId);

    const existing = message.reactions.find(
      (reaction: { emoji: string; count: number }) => reaction.emoji === emoji,
    );

    const reactions = existing
      ? message.reactions.map((reaction: { emoji: string; count: number }) =>
          reaction.emoji === emoji
            ? {
                ...reaction,
                count: reaction.count + 1,
              }
            : reaction,
        )
      : [
          ...message.reactions,
          {
            emoji,
            count: 1,
          },
        ];

    await ctx.db.patch(args.messageId, {
      reactions,
    });

    return {
      success: true,
      messageId: args.messageId,
      emoji,
      count: existing?.count !== undefined ? existing.count + 1 : 1,
      reactions,
    };
  },
});

// ============================================================================
// REMOVE REACTION
// ============================================================================

/**
 * Retire une occurrence d'une réaction.
 *
 * Si count > 1 :
 *   count - 1
 *
 * Si count === 1 :
 *   suppression complète de l'emoji.
 *
 * IMPORTANT :
 * Le schéma actuel stocke uniquement { emoji, count } et ne mémorise
 * pas quel utilisateur a posé la réaction.
 *
 * Cette fonction ne peut donc pas déterminer précisément :
 * "est-ce MOI qui ai déjà réagi ?"
 *
 * Elle agit uniquement sur le compteur global.
 */
export const removeReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },

  handler: async (ctx, args) => {
    const emoji = normalizeEmoji(args.emoji);

    if (!emoji) {
      throw new ConvexError({
        message: "Emoji invalide",
        code: "INVALID_EMOJI",
      });
    }

    const { message } = await requireMessageAccess(ctx, args.messageId);

    const existing = message.reactions.find(
      (reaction: { emoji: string; count: number }) => reaction.emoji === emoji,
    );

    if (!existing) {
      return {
        success: true,
        removed: false,
        messageId: args.messageId,
        emoji,
        reactions: message.reactions,
      };
    }

    let reactions;

    if (existing.count <= 1) {
      reactions = message.reactions.filter(
        (reaction: { emoji: string; count: number }) =>
          reaction.emoji !== emoji,
      );
    } else {
      reactions = message.reactions.map(
        (reaction: { emoji: string; count: number }) =>
          reaction.emoji === emoji
            ? {
                ...reaction,
                count: reaction.count - 1,
              }
            : reaction,
      );
    }

    await ctx.db.patch(args.messageId, {
      reactions,
    });

    return {
      success: true,
      removed: true,
      messageId: args.messageId,
      emoji,
      reactions,
    };
  },
});

// ============================================================================
// TOGGLE REACTION
// ============================================================================

/**
 * Compatibilité pratique avec le frontend.
 *
 * IMPORTANT :
 * Avec le schéma actuel, le backend ne connaît pas l'utilisateur
 * ayant posé chaque réaction.
 *
 * Par conséquent, "toggle" signifie ici :
 *
 * - si l'emoji existe -> décrémenter ;
 * - sinon -> incrémenter.
 *
 * Si nous voulons plus tard un vrai système "Moi / pas moi",
 * il faudra ajouter une table reactionMembers ou stocker userId
 * dans chaque réaction.
 */
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },

  handler: async (ctx, args) => {
    const emoji = normalizeEmoji(args.emoji);

    if (!emoji) {
      throw new ConvexError({
        message: "Emoji invalide",
        code: "INVALID_EMOJI",
      });
    }

    const { message } = await requireMessageAccess(ctx, args.messageId);

    const existing = message.reactions.find(
      (reaction: { emoji: string; count: number }) => reaction.emoji === emoji,
    );

    // ------------------------------------------------------------------------
    // Si la réaction n'existe pas -> ajouter
    // ------------------------------------------------------------------------

    if (!existing) {
      const reactions = [
        ...message.reactions,
        {
          emoji,
          count: 1,
        },
      ];

      await ctx.db.patch(args.messageId, {
        reactions,
      });

      return {
        success: true,
        action: "added" as const,
        messageId: args.messageId,
        emoji,
        count: 1,
        reactions,
      };
    }

    // ------------------------------------------------------------------------
    // Si count = 1 -> supprimer complètement
    // ------------------------------------------------------------------------

    if (existing.count <= 1) {
      const reactions = message.reactions.filter(
        (reaction: { emoji: string; count: number }) =>
          reaction.emoji !== emoji,
      );

      await ctx.db.patch(args.messageId, {
        reactions,
      });

      return {
        success: true,
        action: "removed" as const,
        messageId: args.messageId,
        emoji,
        count: 0,
        reactions,
      };
    }

    // ------------------------------------------------------------------------
    // Sinon -> décrémenter
    // ------------------------------------------------------------------------

    const reactions = message.reactions.map(
      (reaction: { emoji: string; count: number }) =>
        reaction.emoji === emoji
          ? {
              ...reaction,
              count: reaction.count - 1,
            }
          : reaction,
    );

    await ctx.db.patch(args.messageId, {
      reactions,
    });

    const newReaction = reactions.find(
      (reaction: { emoji: string; count: number }) => reaction.emoji === emoji,
    );

    return {
      success: true,
      action: "removed" as const,
      messageId: args.messageId,
      emoji,
      count: newReaction?.count ?? 0,
      reactions,
    };
  },
});

// ============================================================================
// GET REACTIONS
// ============================================================================

/**
 * Retourne les réactions d'un message.
 */
export const getReactions = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const { message } = await requireMessageAccess(ctx, args.messageId);

    return message.reactions;
  },
});

// ============================================================================
// GET REACTION COUNT
// ============================================================================

/**
 * Retourne le nombre total de réactions présentes sur le message.
 *
 * Exemple :
 *
 * ❤️ 3
 * 😂 2
 * 👍 1
 *
 * total = 6
 */
export const getReactionCount = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const { message } = await requireMessageAccess(ctx, args.messageId);

    return message.reactions.reduce(
      (total: number, reaction: { emoji: string; count: number }) =>
        total + reaction.count,
      0,
    );
  },
});

// ============================================================================
// GET SPECIFIC REACTION
// ============================================================================

/**
 * Retourne le compteur d'un emoji précis.
 */
export const getReaction = query({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },

  handler: async (ctx, args) => {
    const emoji = normalizeEmoji(args.emoji);

    if (!emoji) {
      return null;
    }

    const { message } = await requireMessageAccess(ctx, args.messageId);

    return (
      message.reactions.find(
        (reaction: { emoji: string; count: number }) =>
          reaction.emoji === emoji,
      ) ?? null
    );
  },
});

// ============================================================================
// CLEAR ALL REACTIONS
// ============================================================================

/**
 * Supprime toutes les réactions d'un message.
 *
 * Cette opération est volontairement protégée par la même vérification
 * d'accès à la conversation.
 */
export const clearReactions = mutation({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    await requireMessageAccess(ctx, args.messageId);

    await ctx.db.patch(args.messageId, {
      reactions: [],
    });

    return {
      success: true,
      messageId: args.messageId,
      reactions: [],
    };
  },
});
