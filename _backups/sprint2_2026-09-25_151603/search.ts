// convex/messages/search.ts

import { v } from "convex/values";
import { query } from "../_generated/server";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// TYPES
// ============================================================================

type SearchResult = {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  status: "sent" | "delivered" | "read" | "failed";
  replyToId?: string;
  sharedPublicationId?: string;
  conversationName: string;
};

// ============================================================================
// RECHERCHER DANS MES MESSAGES
// ============================================================================
//
// Recherche uniquement dans les conversations auxquelles l'utilisateur
// connecté appartient.
//
// NOTE : la table "messages" de ton schema ne possède actuellement pas de
// searchIndex. On effectue donc la recherche côté query sur les messages
// accessibles à l'utilisateur.
//
// Pour une recherche très volumineuse, on pourra ensuite ajouter un
// searchIndex Convex sur "messages.text".
// ============================================================================

export const searchMessages = query({
  args: {
    query: v.string(),
    conversationId: v.optional(v.id("conversations")),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args): Promise<SearchResult[]> => {
    const user = await requireAuthenticatedUser(ctx);

    const searchText = args.query.trim().toLowerCase();

    if (!searchText) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 30, 1), 100);

    // ------------------------------------------------------------------------
    // Récupérer les conversations auxquelles l'utilisateur appartient
    // ------------------------------------------------------------------------

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let conversationIds = memberships.map((member) => member.conversationId);

    // ------------------------------------------------------------------------
    // Filtre conversation spécifique
    // ------------------------------------------------------------------------

    if (args.conversationId) {
      const allowed = conversationIds.includes(args.conversationId);

      if (!allowed) {
        throw new Error("Vous n'avez pas accès à cette conversation");
      }

      conversationIds = [args.conversationId];
    }

    if (conversationIds.length === 0) {
      return [];
    }

    // ------------------------------------------------------------------------
    // Recherche des messages
    // ------------------------------------------------------------------------

    const results: SearchResult[] = [];

    for (const conversationId of conversationIds) {
      if (results.length >= limit) {
        break;
      }

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversationId),
        )
        .collect();

      const conversation = await ctx.db.get(conversationId);

      if (!conversation) {
        continue;
      }

      const conversationName = conversation.groupName ?? "Conversation";

      for (const message of messages) {
        if (results.length >= limit) {
          break;
        }

        if (!message.text.toLowerCase().includes(searchText)) {
          continue;
        }

        const sender = await ctx.db.get(message.senderId);

        if (!sender) {
          continue;
        }

        results.push({
          messageId: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          text: message.text,
          status: message.status,
          replyToId: message.replyToId,
          sharedPublicationId: message.sharedPublicationId,
          conversationName: conversation.isGroup
            ? conversationName
            : sender.name,
        });
      }
    }

    // ------------------------------------------------------------------------
    // Résultats du plus récent au plus ancien
    // ------------------------------------------------------------------------

    results.reverse();

    return results.slice(0, limit);
  },
});

// ============================================================================
// RECHERCHE DANS UNE CONVERSATION
// ============================================================================

export const searchConversation = query({
  args: {
    conversationId: v.id("conversations"),
    query: v.string(),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args): Promise<SearchResult[]> => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Vérifier l'accès
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("Vous n'avez pas accès à cette conversation");
    }

    const searchText = args.query.trim().toLowerCase();

    if (!searchText) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    // ------------------------------------------------------------------------
    // Conversation
    // ------------------------------------------------------------------------

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new Error("Conversation introuvable");
    }

    // ------------------------------------------------------------------------
    // Messages
    // ------------------------------------------------------------------------

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const results: SearchResult[] = [];

    for (const message of messages) {
      if (results.length >= limit) {
        break;
      }

      if (!message.text.toLowerCase().includes(searchText)) {
        continue;
      }

      const sender = await ctx.db.get(message.senderId);

      if (!sender) {
        continue;
      }

      results.push({
        messageId: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        senderName: sender.name,
        senderAvatar: sender.avatar,
        text: message.text,
        status: message.status,
        replyToId: message.replyToId,
        sharedPublicationId: message.sharedPublicationId,
        conversationName: conversation.isGroup
          ? (conversation.groupName ?? "Conversation")
          : sender.name,
      });
    }

    // Les messages sont renvoyés du plus récent au plus ancien.
    return results.reverse();
  },
});

// ============================================================================
// RECHERCHER UNE CONVERSATION
// ============================================================================
//
// Permet au sélecteur de conversations de rechercher par :
// - nom du groupe
// - nom d'un participant
//
// Pour une conversation privée, le nom du correspondant est utilisé.
// ============================================================================

export const searchConversations = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const searchText = args.query.trim().toLowerCase();

    if (!searchText) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 30, 1), 100);

    // ------------------------------------------------------------------------
    // Mes appartenances
    // ------------------------------------------------------------------------

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = [];

    for (const membership of memberships) {
      if (results.length >= limit) {
        break;
      }

      const conversation = await ctx.db.get(membership.conversationId);

      if (!conversation) {
        continue;
      }

      // ----------------------------------------------------------------------
      // Groupe
      // ----------------------------------------------------------------------

      if (conversation.isGroup) {
        const name = conversation.groupName ?? "Groupe";

        if (name.toLowerCase().includes(searchText)) {
          results.push({
            conversationId: conversation._id,
            isGroup: true,
            name,
            avatar: conversation.groupAvatar,
            lastMessageText: conversation.lastMessageText,
            lastMessageSenderId: conversation.lastMessageSenderId,
            updatedAt: conversation.updatedAt,
          });
        }

        continue;
      }

      // ----------------------------------------------------------------------
      // Conversation privée
      // ----------------------------------------------------------------------

      const otherMember = conversation.participantIds.find(
        (participantId) => participantId !== user._id,
      );

      if (!otherMember) {
        continue;
      }

      const otherUser = await ctx.db.get(otherMember);

      if (!otherUser) {
        continue;
      }

      if (!otherUser.name.toLowerCase().includes(searchText)) {
        continue;
      }

      results.push({
        conversationId: conversation._id,
        isGroup: false,
        name: otherUser.name,
        avatar: otherUser.avatar,
        otherUserId: otherUser._id,
        lastMessageText: conversation.lastMessageText,
        lastMessageSenderId: conversation.lastMessageSenderId,
        updatedAt: conversation.updatedAt,
      });
    }

    // ------------------------------------------------------------------------
    // Plus récemment mise à jour en premier
    // ------------------------------------------------------------------------

    results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return results.slice(0, limit);
  },
});

// ============================================================================
// RECHERCHE GLOBALE
// ============================================================================
//
// Recherche simultanément :
//   1. les messages
//   2. les conversations
//
// Utile pour la barre de recherche principale de la messagerie.
// ============================================================================

export const globalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

    const searchText = args.query.trim().toLowerCase();

    if (!searchText) {
      return {
        conversations: [],
        messages: [],
      };
    }

    const limit = Math.min(Math.max(args.limit ?? 20, 1), 50);

    // ------------------------------------------------------------------------
    // Conversations
    // ------------------------------------------------------------------------

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const allowedConversationIds = new Set(
      memberships.map((member) => member.conversationId),
    );

    const conversationResults = [];

    for (const membership of memberships) {
      if (conversationResults.length >= limit) {
        break;
      }

      const conversation = await ctx.db.get(membership.conversationId);

      if (!conversation) {
        continue;
      }

      if (conversation.isGroup) {
        const name = conversation.groupName ?? "Groupe";

        if (name.toLowerCase().includes(searchText)) {
          conversationResults.push({
            conversationId: conversation._id,
            isGroup: true,
            name,
            avatar: conversation.groupAvatar,
            updatedAt: conversation.updatedAt,
          });
        }

        continue;
      }

      const otherMember = conversation.participantIds.find(
        (participantId) => participantId !== user._id,
      );

      if (!otherMember) {
        continue;
      }

      const otherUser = await ctx.db.get(otherMember);

      if (!otherUser) {
        continue;
      }

      if (otherUser.name.toLowerCase().includes(searchText)) {
        conversationResults.push({
          conversationId: conversation._id,
          isGroup: false,
          name: otherUser.name,
          avatar: otherUser.avatar,
          otherUserId: otherUser._id,
          updatedAt: conversation.updatedAt,
        });
      }
    }

    // ------------------------------------------------------------------------
    // Messages
    // ------------------------------------------------------------------------

    const messageResults = [];

    for (const conversationId of allowedConversationIds) {
      if (messageResults.length >= limit) {
        break;
      }

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversationId),
        )
        .collect();

      const conversation = await ctx.db.get(conversationId);

      if (!conversation) {
        continue;
      }

      for (const message of messages) {
        if (messageResults.length >= limit) {
          break;
        }

        if (!message.text.toLowerCase().includes(searchText)) {
          continue;
        }

        const sender = await ctx.db.get(message.senderId);

        if (!sender) {
          continue;
        }

        messageResults.push({
          messageId: message._id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          senderName: sender.name,
          senderAvatar: sender.avatar,
          text: message.text,
          status: message.status,
          conversationName: conversation.isGroup
            ? (conversation.groupName ?? "Groupe")
            : sender.name,
        });
      }
    }

    // ------------------------------------------------------------------------
    // Tri
    // ------------------------------------------------------------------------

    conversationResults.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    messageResults.reverse();

    return {
      conversations: conversationResults.slice(0, limit),
      messages: messageResults.slice(0, limit),
    };
  },
});
