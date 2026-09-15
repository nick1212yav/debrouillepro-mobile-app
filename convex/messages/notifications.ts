// convex/messages/notifications.ts

import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// ============================================================================
// NOTIFICATIONS DU MODULE MESSAGES
// ============================================================================
//
// Ce fichier ne gère PAS la liste générale des notifications.
//
// Il sert uniquement à créer les notifications liées aux messages.
//
// La table notifications reste la table centrale.
// Les messages restent limités aux champs définis dans le schema actuel.
// ============================================================================

// ============================================================================
// NOTIFICATION — NOUVEAU MESSAGE
// ============================================================================

/**
 * Crée une notification lorsqu'un utilisateur reçoit un nouveau message.
 *
 * Appelée depuis messages.ts après l'envoi réussi du message.
 *
 * Important :
 * - l'expéditeur ne reçoit jamais sa propre notification ;
 * - on vérifie que le destinataire appartient bien à la conversation ;
 * - on respecte le statut isMuted de conversationMembers ;
 * - aucun champ inexistant dans messages n'est utilisé.
 */
export const createMessageNotification = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    recipientId: v.id("users"),

    senderName: v.optional(v.string()),
    senderAvatar: v.optional(v.string()),

    messageId: v.id("messages"),
    messageText: v.string(),
  },

  handler: async (ctx, args) => {
    // ------------------------------------------------------------------------
    // Ne jamais notifier l'expéditeur lui-même.
    // ------------------------------------------------------------------------

    if (args.senderId === args.recipientId) {
      return;
    }

    // ------------------------------------------------------------------------
    // Vérifier que le destinataire appartient bien à la conversation.
    // ------------------------------------------------------------------------

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q
          .eq("conversationId", args.conversationId)
          .eq("userId", args.recipientId),
      )
      .unique();

    if (!member) {
      return;
    }

    // ------------------------------------------------------------------------
    // Si la conversation est muette, ne pas créer de notification.
    //
    // Le compteur unreadCount reste géré par messages.ts.
    // ------------------------------------------------------------------------

    if (member.isMuted) {
      return;
    }

    // ------------------------------------------------------------------------
    // Nettoyer le texte affiché dans la notification.
    // ------------------------------------------------------------------------

    const cleanText = args.messageText.replace(/\s+/g, " ").trim();

    const preview =
      cleanText.length > 120 ? `${cleanText.slice(0, 117)}...` : cleanText;

    // ------------------------------------------------------------------------
    // Éviter les doublons immédiats pour le même message.
    //
    // publicationId n'est pas utilisé ici car il ne correspond pas
    // à l'identité d'un message.
    //
    // Le messageId est donc placé dans le body sous forme interne.
    // ------------------------------------------------------------------------

    const notificationBody = preview
      ? preview
      : "Vous avez reçu un nouveau message.";

    const recentNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.recipientId))
      .order("desc")
      .take(20);

    const duplicate = recentNotifications.find(
      (notification) =>
        notification.type === "message" &&
        notification.fromUserId === args.senderId &&
        notification.body === notificationBody &&
        notification._creationTime > Date.now() - 30_000,
    );

    if (duplicate) {
      return;
    }

    // ------------------------------------------------------------------------
    // Création de la notification.
    // ------------------------------------------------------------------------

    await ctx.db.insert("notifications", {
      userId: args.recipientId,

      type: "message",

      fromUserId: args.senderId,
      fromUserName: args.senderName,
      fromUserAvatar: args.senderAvatar,

      module: "Messages",

      title: args.senderName?.trim() || "Nouveau message",

      body: notificationBody,

      read: false,

      pinned: false,

      priority: "high",

      initials: buildInitials(args.senderName),

      actionPage: "messages",
    });
  },
});

// ============================================================================
// NOTIFICATION — NOUVEAU MESSAGE POUR PLUSIEURS MEMBRES
// ============================================================================

/**
 * Crée les notifications pour tous les membres d'une conversation
 * sauf l'expéditeur.
 *
 * Utile pour les conversations de groupe.
 *
 * Le compteur unreadCount n'est PAS modifié ici :
 * il appartient à la logique d'envoi des messages.
 */
export const notifyConversationMembers = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),

    senderName: v.optional(v.string()),
    senderAvatar: v.optional(v.string()),

    messageId: v.id("messages"),
    messageText: v.string(),
  },

  handler: async (ctx, args) => {
    // ------------------------------------------------------------------------
    // Récupérer tous les membres de la conversation.
    // ------------------------------------------------------------------------

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    // ------------------------------------------------------------------------
    // Préparer le texte.
    // ------------------------------------------------------------------------

    const cleanText = args.messageText.replace(/\s+/g, " ").trim();

    const preview =
      cleanText.length > 120 ? `${cleanText.slice(0, 117)}...` : cleanText;

    const body = preview || "Vous avez reçu un nouveau message.";

    // ------------------------------------------------------------------------
    // Notifications en parallèle.
    // ------------------------------------------------------------------------

    await Promise.all(
      members
        .filter((member) => member.userId !== args.senderId && !member.isMuted)
        .map(async (member) => {
          // Vérifier qu'une notification identique
          // n'a pas déjà été créée immédiatement.
          const recent = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", member.userId))
            .order("desc")
            .take(10);

          const duplicate = recent.find(
            (notification) =>
              notification.type === "message" &&
              notification.fromUserId === args.senderId &&
              notification.body === body &&
              notification._creationTime > Date.now() - 30_000,
          );

          if (duplicate) {
            return;
          }

          await ctx.db.insert("notifications", {
            userId: member.userId,

            type: "message",

            fromUserId: args.senderId,
            fromUserName: args.senderName,
            fromUserAvatar: args.senderAvatar,

            module: "Messages",

            title: args.senderName?.trim() || "Nouveau message",

            body,

            read: false,

            pinned: false,

            priority: "high",

            initials: buildInitials(args.senderName),

            actionPage: "messages",
          });
        }),
    );
  },
});

// ============================================================================
// NOTIFICATION — MESSAGE VOCAL
// ============================================================================

/**
 * Notification spécialisée pour un message vocal.
 *
 * Le fichier vocal lui-même est géré par le module voice.ts.
 *
 * Ce fichier ne rajoute donc aucun champ vocal dans messages.
 */
export const createVoiceNotification = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    recipientId: v.id("users"),

    senderName: v.optional(v.string()),
    senderAvatar: v.optional(v.string()),

    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    if (args.senderId === args.recipientId) {
      return;
    }

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q
          .eq("conversationId", args.conversationId)
          .eq("userId", args.recipientId),
      )
      .unique();

    if (!member || member.isMuted) {
      return;
    }

    const recent = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.recipientId))
      .order("desc")
      .take(10);

    const duplicate = recent.find(
      (notification) =>
        notification.type === "message" &&
        notification.fromUserId === args.senderId &&
        notification.body === "🎤 Message vocal" &&
        notification._creationTime > Date.now() - 30_000,
    );

    if (duplicate) {
      return;
    }

    await ctx.db.insert("notifications", {
      userId: args.recipientId,

      type: "message",

      fromUserId: args.senderId,

      fromUserName: args.senderName,

      fromUserAvatar: args.senderAvatar,

      module: "Messages",

      title: args.senderName?.trim() || "Nouveau message",

      body: "🎤 Message vocal",

      read: false,

      pinned: false,

      priority: "high",

      initials: buildInitials(args.senderName),

      actionPage: "messages",
    });
  },
});

// ============================================================================
// NOTIFICATION — MESSAGE AVEC PUBLICATION PARTAGÉE
// ============================================================================

/**
 * Notification lorsqu'un utilisateur reçoit
 * un message contenant une publication partagée.
 *
 * sharedPublicationId existe dans messages.ts.
 * On n'ajoute donc aucun champ supplémentaire à messages.
 */
export const createSharedPublicationNotification = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    recipientId: v.id("users"),

    senderName: v.optional(v.string()),
    senderAvatar: v.optional(v.string()),

    messageId: v.id("messages"),
    publicationId: v.id("publications"),
  },

  handler: async (ctx, args) => {
    if (args.senderId === args.recipientId) {
      return;
    }

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation_and_user", (q) =>
        q
          .eq("conversationId", args.conversationId)
          .eq("userId", args.recipientId),
      )
      .unique();

    if (!member || member.isMuted) {
      return;
    }

    const recent = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.recipientId))
      .order("desc")
      .take(10);

    const duplicate = recent.find(
      (notification) =>
        notification.type === "message" &&
        notification.fromUserId === args.senderId &&
        notification.publicationId === args.publicationId &&
        notification._creationTime > Date.now() - 30_000,
    );

    if (duplicate) {
      return;
    }

    await ctx.db.insert("notifications", {
      userId: args.recipientId,

      type: "message",

      fromUserId: args.senderId,

      fromUserName: args.senderName,

      fromUserAvatar: args.senderAvatar,

      publicationId: args.publicationId,

      module: "Messages",

      title: args.senderName?.trim() || "Nouvelle publication",

      body: "📎 Vous a envoyé une publication",

      read: false,

      pinned: false,

      priority: "high",

      initials: buildInitials(args.senderName),

      actionPage: "messages",
    });
  },
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère les initiales utilisées par l'interface Notifications.
 */
function buildInitials(name?: string): string | undefined {
  if (!name) {
    return undefined;
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
