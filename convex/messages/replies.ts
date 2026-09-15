// convex/messages/replies.ts

import { v } from "convex/values";
import { ConvexError } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// AUTH
// ============================================================================

async function requireUser(ctx: MutationCtx | QueryCtx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      message: "Non authentifié",
      code: "UNAUTHENTICATED",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      message: "Utilisateur introuvable",
      code: "NOT_FOUND",
    });
  }

  return user;
}

// ============================================================================
// MESSAGE ACCESS
// ============================================================================

/**
 * Vérifie que l'utilisateur courant appartient à la conversation
 * du message concerné.
 */
async function requireMessageAccess(
  ctx: MutationCtx | QueryCtx,
  messageId: Id<"messages">,
) {
  const user = await requireUser(ctx);

  const message = await ctx.db.get(messageId);

  if (!message) {
    throw new ConvexError({
      message: "Message introuvable",
      code: "NOT_FOUND",
    });
  }

  const member = await ctx.db
    .query("conversationMembers")
    .withIndex("by_user_and_conversation", (q) =>
      q.eq("userId", user._id).eq("conversationId", message.conversationId),
    )
    .unique();

  if (!member) {
    throw new ConvexError({
      message: "Vous ne faites pas partie de cette conversation",
      code: "FORBIDDEN",
    });
  }

  return {
    user,
    message,
  };
}

// ============================================================================
// CREATE REPLY
// ============================================================================

/**
 * Crée un message qui répond à un autre message.
 *
 * La relation est enregistrée directement dans messages.replyToId.
 *
 * Exemple :
 *
 * Message A
 *   _id = abc
 *
 * Message B
 *   replyToId = abc
 */
export const createReply = mutation({
  args: {
    conversationId: v.id("conversations"),
    replyToId: v.id("messages"),
    text: v.string(),
    sharedPublicationId: v.optional(v.id("publications")),
  },

  handler: async (ctx, args): Promise<Id<"messages">> => {
    const user = await requireUser(ctx);

    const text = args.text.trim();

    if (!text) {
      throw new ConvexError({
        message: "Le message ne peut pas être vide",
        code: "EMPTY_MESSAGE",
      });
    }

    // ------------------------------------------------------------------------
    // Vérifier le message auquel on répond
    // ------------------------------------------------------------------------

    const repliedMessage = await ctx.db.get(args.replyToId);

    if (!repliedMessage) {
      throw new ConvexError({
        message: "Message auquel vous répondez introuvable",
        code: "REPLY_TARGET_NOT_FOUND",
      });
    }

    // ------------------------------------------------------------------------
    // Le message cité doit appartenir à la même conversation
    // ------------------------------------------------------------------------

    if (repliedMessage.conversationId !== args.conversationId) {
      throw new ConvexError({
        message:
          "Le message auquel vous répondez n'appartient pas à cette conversation",
        code: "INVALID_REPLY_CONVERSATION",
      });
    }

    // ------------------------------------------------------------------------
    // Vérifier que l'utilisateur est membre de la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new ConvexError({
        message: "Vous ne faites pas partie de cette conversation",
        code: "FORBIDDEN",
      });
    }

    // ------------------------------------------------------------------------
    // Créer le message
    // ------------------------------------------------------------------------

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      text,
      status: "sent",
      reactions: [],
      replyToId: args.replyToId,
      sharedPublicationId: args.sharedPublicationId,
      type: "text",
    });

    // ------------------------------------------------------------------------
    // Mettre à jour la conversation
    // ------------------------------------------------------------------------

    const now = new Date().toISOString();

    await ctx.db.patch(args.conversationId, {
      lastMessageText: text,
      lastMessageSenderId: user._id,
      updatedAt: now,
    });

    // ------------------------------------------------------------------------
    // Incrémenter les messages non lus des autres membres
    // ------------------------------------------------------------------------

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    await Promise.all(
      members
        .filter((m) => m.userId !== user._id)
        .map((m) =>
          ctx.db.patch(m._id, {
            unreadCount: m.unreadCount + 1,
          }),
        ),
    );

    // ------------------------------------------------------------------------
    // Supprimer le statut "typing" de l'expéditeur
    // ------------------------------------------------------------------------

    const typingRow = await ctx.db
      .query("typingStatus")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (typingRow) {
      await ctx.db.delete(typingRow._id);
    }

    return messageId;
  },
});

// ============================================================================
// GET REPLY TARGET
// ============================================================================

/**
 * Retourne le message auquel un message répond.
 */
export const getReplyTarget = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const { message } = await requireMessageAccess(ctx, args.messageId);

    if (!message.replyToId) {
      return null;
    }

    const repliedMessage = await ctx.db.get(message.replyToId);

    if (!repliedMessage) {
      return null;
    }

    const sender = await ctx.db.get(repliedMessage.senderId);

    return {
      _id: repliedMessage._id,
      _creationTime: repliedMessage._creationTime,
      text: repliedMessage.text,
      senderId: repliedMessage.senderId,
      senderName: sender?.name,
      status: repliedMessage.status,
      reactions: repliedMessage.reactions,
      conversationId: repliedMessage.conversationId,
    };
  },
});

// ============================================================================
// GET REPLY PREVIEW
// ============================================================================

/**
 * Retourne uniquement les informations nécessaires à l'affichage
 * du bandeau "Répondre à..."
 */
export const getReplyPreview = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const { message } = await requireMessageAccess(ctx, args.messageId);

    if (!message.replyToId) {
      return null;
    }

    const repliedMessage = await ctx.db.get(message.replyToId);

    if (!repliedMessage) {
      return null;
    }

    const sender = await ctx.db.get(repliedMessage.senderId);

    return {
      messageId: repliedMessage._id,
      text: repliedMessage.text,
      senderName: sender?.name,
    };
  },
});

// ============================================================================
// GET REPLIES TO A MESSAGE
// ============================================================================

/**
 * Retourne tous les messages qui répondent directement
 * à un message donné.
 *
 * Il n'y a actuellement pas d'index by_replyToId dans ton schéma,
 * donc on utilise une recherche sur les messages de la conversation.
 */
export const getReplies = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const { message } = await requireMessageAccess(ctx, args.messageId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", message.conversationId),
      )
      .order("asc")
      .collect();

    const replies = messages.filter(
      (item) => item.replyToId === args.messageId,
    );

    return await Promise.all(
      replies.map(async (reply) => {
        const sender = await ctx.db.get(reply.senderId);

        return {
          _id: reply._id,
          _creationTime: reply._creationTime,
          text: reply.text,
          senderId: reply.senderId,
          senderName: sender?.name,
          status: reply.status,
          reactions: reply.reactions,
          replyToId: reply.replyToId,
          sharedPublicationId: reply.sharedPublicationId,
        };
      }),
    );
  },
});

// ============================================================================
// CHECK IF MESSAGE IS A REPLY
// ============================================================================

/**
 * Indique si un message est une réponse à un autre message.
 */
export const isReply = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args): Promise<boolean> => {
    const { message } = await requireMessageAccess(ctx, args.messageId);

    return !!message.replyToId;
  },
});

// ============================================================================
// REMOVE REPLY LINK
// ============================================================================

/**
 * Retire uniquement le lien replyToId d'un message.
 *
 * Le message lui-même n'est pas supprimé.
 */
export const removeReplyLink = mutation({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args): Promise<void> => {
    await requireMessageAccess(ctx, args.messageId);

    await ctx.db.patch(args.messageId, {
      replyToId: undefined,
    });
  },
});
