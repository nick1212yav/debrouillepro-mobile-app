// convex/messages/voice.ts

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// ENVOYER UN MESSAGE VOCAL
// ============================================================================

export const sendVoiceMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    fileId: v.id("_storage"),
    duration: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);
    const now = new Date().toISOString();

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

    // ------------------------------------------------------------------------
    // Validation de la durée
    // ------------------------------------------------------------------------

    if (args.duration < 0) {
      throw new Error("Durée du message vocal invalide");
    }

    // ------------------------------------------------------------------------
    // Créer le message vocal
    // ------------------------------------------------------------------------

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      text: "🎤 Message vocal",
      status: "sent",
      reactions: [],
      replyToId: undefined,
      sharedPublicationId: undefined,

      isEdited: false,
      isDeleted: false,
      isPinned: false,
      type: "voice",
      voiceFileId: args.fileId,
      voiceDuration: args.duration,
      // attachmentIds et isEncrypted ont été retirés pour correspondre au schéma de la table
    });

    // ------------------------------------------------------------------------
    // Mettre à jour la conversation
    // ------------------------------------------------------------------------

    await ctx.db.patch(args.conversationId, {
      lastMessageText: "🎤 Message vocal",
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
        .filter((conversationMember) => conversationMember.userId !== user._id)
        .map((conversationMember) =>
          ctx.db.patch(conversationMember._id, {
            unreadCount: conversationMember.unreadCount + 1,
          }),
        ),
    );

    return messageId;
  },
});

// ============================================================================
// RÉCUPÉRER UN MESSAGE VOCAL
// ============================================================================

export const getVoiceMessage = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Récupérer le message
    // ------------------------------------------------------------------------

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      return null;
    }

    // ------------------------------------------------------------------------
    // Vérifier qu'il s'agit bien d'un message vocal
    // ------------------------------------------------------------------------

    if (message.type !== "voice") {
      return null;
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

    return {
      messageId: message._id,
      fileId: message.voiceFileId,
      duration: message.voiceDuration,
    };
  },
});
