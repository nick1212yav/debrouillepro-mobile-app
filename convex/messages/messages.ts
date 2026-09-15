// convex/messages/messages.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

type CurrentUser = Doc<"users">;

type MessageWithSender = Doc<"messages"> & {
  sender: Doc<"users"> | null;
};

type MessagePage = {
  page: MessageWithSender[];
  isDone: boolean;
  continueCursor: string;
};

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Retourne l'utilisateur Convex correspondant à l'identité authentifiée.
 */
async function getCurrentUser(ctx: any): Promise<CurrentUser> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("UNAUTHENTICATED");
  }

  const tokenIdentifier = identity.tokenIdentifier;

  if (!tokenIdentifier) {
    throw new Error("AUTH_TOKEN_IDENTIFIER_MISSING");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

// ============================================================================
// CONVERSATION ACCESS
// ============================================================================

/**
 * Vérifie que l'utilisateur connecté appartient à la conversation.
 *
 * On utilise conversationMembers en priorité.
 * participantIds reste un fallback pour les anciennes conversations.
 */
async function requireConversationAccess(
  ctx: any,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
) {
  const conversation = await ctx.db.get(conversationId);

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  const member = await ctx.db
    .query("conversationMembers")
    .withIndex("by_user_and_conversation", (q: any) =>
      q.eq("userId", userId).eq("conversationId", conversationId),
    )
    .unique();

  const isParticipant = conversation.participantIds.some(
    (participantId: Id<"users">) => participantId === userId,
  );

  if (!member && !isParticipant) {
    throw new Error("FORBIDDEN");
  }

  return conversation;
}

// ============================================================================
// MESSAGE ENRICHMENT
// ============================================================================

/**
 * Enrichit un message avec les informations de son auteur.
 */
async function enrichMessage(
  ctx: any,
  message: Doc<"messages">,
): Promise<MessageWithSender> {
  const sender = await ctx.db.get(message.senderId);

  return {
    ...message,
    sender,
  };
}

/**
 * Enrichit plusieurs messages.
 */
async function enrichMessages(
  ctx: any,
  messages: Doc<"messages">[],
): Promise<MessageWithSender[]> {
  const result: MessageWithSender[] = [];

  for (const message of messages) {
    result.push(await enrichMessage(ctx, message));
  }

  return result;
}

// ============================================================================
// GET ONE MESSAGE
// ============================================================================

/**
 * Récupère un message précis.
 */
export const get = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      return null;
    }

    await requireConversationAccess(
      ctx,
      message.conversationId,
      currentUser._id,
    );

    return await enrichMessage(ctx, message);
  },
});

// ============================================================================
// LIST MESSAGES
// ============================================================================

/**
 * Liste paginée des messages d'une conversation.
 *
 * Les messages sont retournés du plus récent au plus ancien.
 *
 * Exemple côté frontend :
 *
 * useQuery(api.messages.messages.list, {
 *   conversationId,
 *   paginationOpts: {
 *     numItems: 30,
 *     cursor: null,
 *   },
 * });
 */
export const list = query({
  args: {
    conversationId: v.id("conversations"),
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args): Promise<MessagePage> => {
    const currentUser = await getCurrentUser(ctx);

    await requireConversationAccess(ctx, args.conversationId, currentUser._id);

    const result = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await enrichMessages(ctx, result.page);

    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

// ============================================================================
// GET RECENT MESSAGES
// ============================================================================

/**
 * Récupère les derniers messages sans pagination.
 *
 * Utile pour :
 * - aperçu rapide ;
 * - écran de conversation ;
 * - préchargement ;
 * - tests.
 */
export const getRecent = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireConversationAccess(ctx, args.conversationId, currentUser._id);

    const requestedLimit = args.limit ?? 50;

    const limit = Math.min(Math.max(requestedLimit, 1), 100);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(limit);

    return await enrichMessages(ctx, messages);
  },
});

// ============================================================================
// SEND MESSAGE
// ============================================================================

/**
 * Envoie un message.
 *
 * Cette mutation :
 *
 * 1. authentifie l'utilisateur ;
 * 2. vérifie son accès à la conversation ;
 * 3. vérifie le statut des utilisateurs ;
 * 4. crée le message ;
 * 5. met à jour la conversation ;
 * 6. incrémente les messages non lus des autres membres.
 */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    replyToId: v.optional(v.id("messages")),
    sharedPublicationId: v.optional(v.id("publications")),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const conversation = await requireConversationAccess(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    // ------------------------------------------------------------------------
    // Vérification de la réponse
    // ------------------------------------------------------------------------

    if (args.replyToId) {
      const replyTarget = await ctx.db.get(args.replyToId);

      if (!replyTarget) {
        throw new Error("REPLY_MESSAGE_NOT_FOUND");
      }

      if (replyTarget.conversationId !== args.conversationId) {
        throw new Error("REPLY_MESSAGE_WRONG_CONVERSATION");
      }
    }

    // ------------------------------------------------------------------------
    // Vérification de la publication partagée
    // ------------------------------------------------------------------------

    if (args.sharedPublicationId) {
      const publication = await ctx.db.get(args.sharedPublicationId);

      if (!publication) {
        throw new Error("PUBLICATION_NOT_FOUND");
      }
    }

    // ------------------------------------------------------------------------
    // Création du message
    // ------------------------------------------------------------------------

    const messageId = await ctx.db.insert("messages", {
      type: "text",
      conversationId: args.conversationId,
      senderId: currentUser._id,
      text: args.text,
      status: "sent",
      reactions: [],
      replyToId: args.replyToId,
      sharedPublicationId: args.sharedPublicationId,
    });

    // ------------------------------------------------------------------------
    // Mise à jour de la conversation
    // ------------------------------------------------------------------------

    const previewText =
      args.text.trim().length > 0
        ? args.text.trim()
        : args.sharedPublicationId
          ? "Publication partagée"
          : "Nouveau message";

    await ctx.db.patch(args.conversationId, {
      lastMessageText: previewText,
      lastMessageSenderId: currentUser._id,
      updatedAt: new Date().toISOString(),
    });

    // ------------------------------------------------------------------------
    // Gestion des membres / unreadCount
    // ------------------------------------------------------------------------

    const existingMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const membersByUser = new Map<string, Doc<"conversationMembers">>();

    for (const member of existingMembers) {
      membersByUser.set(String(member.userId), member);
    }

    // ------------------------------------------------------------------------
    // Compatibilité avec les anciennes conversations
    //
    // Si participantIds contient un utilisateur qui n'a pas encore
    // conversationMembers, on crée automatiquement son membership.
    // ------------------------------------------------------------------------

    for (const participantId of conversation.participantIds) {
      const key = String(participantId);
      const existingMember = membersByUser.get(key);

      if (existingMember) {
        continue;
      }

      const newMemberId = await ctx.db.insert("conversationMembers", {
        conversationId: args.conversationId,
        userId: participantId,
        unreadCount: 0,
        role: "member",
        isMuted: false,
      });

      const newMember = await ctx.db.get(newMemberId);

      if (newMember) {
        membersByUser.set(key, newMember);
      }
    }

    // ------------------------------------------------------------------------
    // Incrémenter les unreadCount de tous les autres participants
    // ------------------------------------------------------------------------

    for (const participantId of conversation.participantIds) {
      if (participantId === currentUser._id) {
        continue;
      }

      const member = membersByUser.get(String(participantId));

      if (!member) {
        continue;
      }

      await ctx.db.patch(member._id, {
        unreadCount: member.unreadCount + 1,
      });
    }

    // ------------------------------------------------------------------------
    // Retourner le message créé enrichi
    // ------------------------------------------------------------------------

    const createdMessage = await ctx.db.get(messageId);

    if (!createdMessage) {
      throw new Error("MESSAGE_CREATION_FAILED");
    }

    return await enrichMessage(ctx, createdMessage);
  },
});

// ============================================================================
// SEND MESSAGE TO USER
// ============================================================================

/**
 * Raccourci pratique pour envoyer un message à un utilisateur.
 *
 * Si la conversation directe existe :
 *   elle est réutilisée.
 *
 * Sinon :
 *   elle est créée.
 *
 * Puis le message est envoyé.
 */
export const sendToUser = mutation({
  args: {
    userId: v.id("users"),
    text: v.string(),
    replyToId: v.optional(v.id("messages")),
    sharedPublicationId: v.optional(v.id("publications")),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (currentUser._id === args.userId) {
      throw new Error("CANNOT_MESSAGE_SELF");
    }

    const targetUser = await ctx.db.get(args.userId);

    if (!targetUser) {
      throw new Error("USER_NOT_FOUND");
    }

    // ------------------------------------------------------------------------
    // Chercher une conversation existante
    // ------------------------------------------------------------------------

    let conversationId: Id<"conversations"> | null = null;

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    for (const member of members) {
      const conversation = await ctx.db.get(member.conversationId);

      if (!conversation) {
        continue;
      }

      if (conversation.isGroup) {
        continue;
      }

      if (conversation.participantIds.length !== 2) {
        continue;
      }

      const hasCurrentUser = conversation.participantIds.some(
        (id) => id === currentUser._id,
      );

      const hasTargetUser = conversation.participantIds.some(
        (id) => id === args.userId,
      );

      if (hasCurrentUser && hasTargetUser) {
        conversationId = conversation._id;
        break;
      }
    }

    // ------------------------------------------------------------------------
    // Créer si nécessaire
    // ------------------------------------------------------------------------

    if (!conversationId) {
      const now = new Date().toISOString();

      conversationId = await ctx.db.insert("conversations", {
        participantIds: [currentUser._id, args.userId],
        isGroup: false,
        updatedAt: now,
      });

      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId: currentUser._id,
        unreadCount: 0,
        role: "member",
        isMuted: false,
      });

      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId: args.userId,
        unreadCount: 0,
        role: "member",
        isMuted: false,
      });
    }

    // ------------------------------------------------------------------------
    // Envoyer
    // ------------------------------------------------------------------------

    const messageId = await ctx.db.insert("messages", {
      type: "text",
      conversationId,
      senderId: currentUser._id,
      text: args.text,
      status: "sent",
      reactions: [],
      replyToId: args.replyToId,
      sharedPublicationId: args.sharedPublicationId,
    });

    const previewText =
      args.text.trim().length > 0
        ? args.text.trim()
        : args.sharedPublicationId
          ? "Publication partagée"
          : "Nouveau message";

    await ctx.db.patch(conversationId, {
      lastMessageText: previewText,
      lastMessageSenderId: currentUser._id,
      updatedAt: new Date().toISOString(),
    });

    // ------------------------------------------------------------------------
    // Incrémenter le compteur de l'autre utilisateur
    // ------------------------------------------------------------------------

    const targetMember = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", conversationId!),
      )
      .unique();

    if (targetMember) {
      await ctx.db.patch(targetMember._id, {
        unreadCount: targetMember.unreadCount + 1,
      });
    }

    const createdMessage = await ctx.db.get(messageId);

    if (!createdMessage) {
      throw new Error("MESSAGE_CREATION_FAILED");
    }

    return {
      conversationId,
      message: await enrichMessage(ctx, createdMessage),
    };
  },
});

// ============================================================================
// MARK MESSAGE AS READ
// ============================================================================

/**
 * Marque un message comme lu.
 *
 * Dans ton schéma actuel, le champ `status` appartient au message lui-même.
 *
 * Pour un message individuel :
 *   sent -> delivered -> read
 *
 * Pour le vrai suivi par utilisateur dans une conversation :
 *   la table readReceipts.ts prendra le relais.
 */
export const markAsRead = mutation({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    await requireConversationAccess(
      ctx,
      message.conversationId,
      currentUser._id,
    );

    // Le propre message n'a pas besoin d'être marqué comme lu.
    if (message.senderId === currentUser._id) {
      return message;
    }

    if (message.status === "read") {
      return message;
    }

    await ctx.db.patch(args.messageId, {
      status: "read",
    });

    const updatedMessage = await ctx.db.get(args.messageId);

    if (!updatedMessage) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    return await enrichMessage(ctx, updatedMessage);
  },
});

// ============================================================================
// MARK CONVERSATION MESSAGES AS READ
// ============================================================================

/**
 * Marque tous les messages reçus d'une conversation comme lus.
 *
 * Cette opération est volontairement limitée aux messages de l'utilisateur
 * connecté.
 *
 * La table readReceipts permettra ensuite un système de lecture beaucoup
 * plus précis pour les conversations de groupe.
 */
export const markConversationAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireConversationAccess(ctx, args.conversationId, currentUser._id);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    let updatedCount = 0;

    for (const message of messages) {
      if (message.senderId === currentUser._id) {
        continue;
      }

      if (message.status === "read") {
        continue;
      }

      await ctx.db.patch(message._id, {
        status: "read",
      });

      updatedCount++;
    }

    // ------------------------------------------------------------------------
    // Reset unreadCount
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId),
      )
      .unique();

    if (member && member.unreadCount !== 0) {
      await ctx.db.patch(member._id, {
        unreadCount: 0,
      });
    }

    return {
      success: true,
      updatedCount,
    };
  },
});

// ============================================================================
// MARK MESSAGE DELIVERED
// ============================================================================

/**
 * Marque un message comme livré.
 *
 * Le système réel de livraison pourra ensuite être automatisé
 * avec les événements/push.
 */
export const markAsDelivered = mutation({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    await requireConversationAccess(
      ctx,
      message.conversationId,
      currentUser._id,
    );

    // Seul le destinataire peut confirmer la livraison.
    if (message.senderId === currentUser._id) {
      throw new Error("SENDER_CANNOT_CONFIRM_DELIVERY");
    }

    if (message.status === "delivered" || message.status === "read") {
      return await enrichMessage(ctx, message);
    }

    await ctx.db.patch(args.messageId, {
      status: "delivered",
    });

    const updatedMessage = await ctx.db.get(args.messageId);

    if (!updatedMessage) {
      throw new Error("MESSAGE_NOT_FOUND");
    }

    return await enrichMessage(ctx, updatedMessage);
  },
});

// ============================================================================
// GET LAST MESSAGE
// ============================================================================

/**
 * Retourne le dernier message d'une conversation.
 */
export const getLast = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireConversationAccess(ctx, args.conversationId, currentUser._id);

    const message = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .first();

    if (!message) {
      return null;
    }

    return await enrichMessage(ctx, message);
  },
});

// ============================================================================
// COUNT MESSAGES
// ============================================================================

/**
 * Retourne le nombre total de messages d'une conversation.
 */
export const count = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireConversationAccess(ctx, args.conversationId, currentUser._id);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return messages.length;
  },
});
