// convex/messages/readReceipts.ts

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "../auth/helpers";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// MARQUER UN MESSAGE COMME LU
// ============================================================================

export const markAsRead = mutation({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier que le message existe
    // ------------------------------------------------------------------------

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message introuvable");
    }

    // ------------------------------------------------------------------------
    // Vérifier que l'utilisateur appartient à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", message.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    // ------------------------------------------------------------------------
    // Éviter les doublons
    // ------------------------------------------------------------------------

    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", user._id),
      )
      .unique();

    const now = new Date().toISOString();

    if (existing) {
      // Actualiser l'heure de lecture
      await ctx.db.patch(existing._id, {
        readAt: now,
      });

      return existing._id;
    }

    // ------------------------------------------------------------------------
    // Créer l'accusé de lecture
    // ------------------------------------------------------------------------

    const receiptId = await ctx.db.insert("readReceipts", {
      messageId: args.messageId,
      userId: user._id,
      readAt: now,
    });

    // ------------------------------------------------------------------------
    // Mettre à jour le statut du message
    //
    // Pour un message envoyé par quelqu'un d'autre, le passage à "read"
    // signifie qu'au moins ce destinataire l'a effectivement lu.
    // ------------------------------------------------------------------------

    if (message.senderId !== user._id && message.status !== "read") {
      await ctx.db.patch(message._id, {
        status: "read",
      });
    }

    return receiptId;
  },
});

// ============================================================================
// MARQUER PLUSIEURS MESSAGES COMME LUS
// ============================================================================

export const markManyAsRead = mutation({
  args: {
    messageIds: v.array(v.id("messages")),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const uniqueMessageIds = [
      ...new Set(args.messageIds.map((id) => id.toString())),
    ];

    const now = new Date().toISOString();

    const receiptIds: Id<"readReceipts">[] = [];

    for (const messageIdString of uniqueMessageIds) {
      const messageId = args.messageIds.find(
        (id) => id.toString() === messageIdString,
      );

      if (!messageId) continue;

      const message = await ctx.db.get(messageId);

      if (!message) {
        continue;
      }

      // Vérifier l'appartenance à la conversation
      const member = await ctx.db
        .query("conversationMembers")
        .withIndex("by_user_and_conversation", (q) =>
          q.eq("userId", user._id).eq("conversationId", message.conversationId),
        )
        .unique();

      if (!member) {
        continue;
      }

      // Un utilisateur ne peut pas créer un accusé de lecture
      // pour son propre message.
      if (message.senderId === user._id) {
        continue;
      }

      const existing = await ctx.db
        .query("readReceipts")
        .withIndex("by_message_user", (q) =>
          q.eq("messageId", messageId).eq("userId", user._id),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          readAt: now,
        });

        receiptIds.push(existing._id);
      } else {
        const receiptId = await ctx.db.insert("readReceipts", {
          messageId,
          userId: user._id,
          readAt: now,
        });

        receiptIds.push(receiptId);
      }

      if (message.status !== "read") {
        await ctx.db.patch(message._id, {
          status: "read",
        });
      }
    }

    return receiptIds;
  },
});

// ============================================================================
// RÉCUPÉRER LES ACCUSÉS DE LECTURE D'UN MESSAGE
// ============================================================================

export const getMessageReadReceipts = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier que le message existe
    // ------------------------------------------------------------------------

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("Message introuvable");
    }

    // ------------------------------------------------------------------------
    // Vérifier l'accès à la conversation
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", message.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Non autorisé");
    }

    // ------------------------------------------------------------------------
    // Récupérer les accusés
    // ------------------------------------------------------------------------

    const receipts = await ctx.db
      .query("readReceipts")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();

    return receipts;
  },
});

// ============================================================================
// RÉCUPÉRER LES ACCUSÉS DE LECTURE D'UNE CONVERSATION
// ============================================================================

export const getConversationReadReceipts = query({
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
    // Récupérer les messages de la conversation
    // ------------------------------------------------------------------------

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    // ------------------------------------------------------------------------
    // Récupérer les receipts de chaque message
    // ------------------------------------------------------------------------

    const result: Array<{
      messageId: Id<"messages">;
      receipts: Doc<"readReceipts">[];
    }> = [];

    for (const message of messages) {
      const receipts = await ctx.db
        .query("readReceipts")
        .withIndex("by_message", (q) => q.eq("messageId", message._id))
        .collect();

      if (receipts.length > 0) {
        result.push({
          messageId: message._id,
          receipts,
        });
      }
    }

    return result;
  },
});

// ============================================================================
// VÉRIFIER SI UN UTILISATEUR A LU UN MESSAGE
// ============================================================================

export const hasRead = query({
  args: {
    messageId: v.id("messages"),
    userId: v.optional(v.id("users")),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const targetUserId = args.userId ?? user._id;

    const receipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", targetUserId),
      )
      .unique();

    return {
      read: !!receipt,
      readAt: receipt?.readAt ?? null,
    };
  },
});
