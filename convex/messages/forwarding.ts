import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "../auth/helpers";
import type { Id } from "../_generated/dataModel";

// ============================================================================
// TRANSFÉRER UN MESSAGE
// ============================================================================

export const forwardMessage = mutation({
  args: {
    messageId: v.id("messages"),
    targetConversationIds: v.array(v.id("conversations")),
  },

  handler: async (ctx, args): Promise<Id<"messages">[]> => {
    const user = await requireAuthenticatedUser(ctx);

    // ------------------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------------------

    if (args.targetConversationIds.length === 0) {
      throw new Error("Aucune conversation de destination sélectionnée");
    }

    const original = await ctx.db.get(args.messageId);

    if (!original) {
      throw new Error("Message original introuvable");
    }

    // Vérifier que l'utilisateur peut accéder au message original.
    const sourceMember = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", original.conversationId),
      )
      .unique();

    if (!sourceMember) {
      throw new Error("Vous n'êtes pas autorisé à transférer ce message");
    }

    const now = new Date().toISOString();
    const newMessageIds: Id<"messages">[] = [];

    // Évite de transférer deux fois vers la même conversation
    // si le frontend envoie des doublons.
    const uniqueConversationIds = [...new Set(args.targetConversationIds)];

    // ------------------------------------------------------------------------
    // Créer une copie dans chaque conversation cible
    // ------------------------------------------------------------------------

    for (const conversationId of uniqueConversationIds) {
      const targetMember = await ctx.db
        .query("conversationMembers")
        .withIndex("by_user_and_conversation", (q) =>
          q.eq("userId", user._id).eq("conversationId", conversationId),
        )
        .unique();

      // L'utilisateur n'appartient pas à cette conversation :
      // on ignore simplement cette destination.
      if (!targetMember) {
        continue;
      }

      // ----------------------------------------------------------------------
      // Préparer le contenu transféré
      // ----------------------------------------------------------------------

      const forwardedText = `[Transféré] ${original.text}`;

      // ----------------------------------------------------------------------
      // Créer le nouveau message
      // ----------------------------------------------------------------------

      const newMessageId = await ctx.db.insert("messages", {
        conversationId,
        senderId: user._id,
        text: forwardedText,
        status: "sent",
        reactions: [],

        // Un transfert ne doit pas créer une nouvelle chaîne de réponse.
        replyToId: undefined,

        // La publication liée n'est pas recopiée automatiquement.
        sharedPublicationId: undefined,

        // Champs compatibles avec le modèle actuel.
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        type: "text",
        voiceFileId: undefined,
        voiceDuration: undefined,
        // isEncrypted a été retiré ici car absent du schéma de la base de données
      });

      // ----------------------------------------------------------------------
      // Mettre à jour la conversation
      // ----------------------------------------------------------------------

      await ctx.db.patch(conversationId, {
        lastMessageText: forwardedText,
        lastMessageSenderId: user._id,
        updatedAt: now,
      });

      // ----------------------------------------------------------------------
      // Incrémenter les messages non lus
      // ----------------------------------------------------------------------

      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", conversationId),
        )
        .collect();

      await Promise.all(
        members
          .filter((member) => member.userId !== user._id)
          .map((member) =>
            ctx.db.patch(member._id, {
              unreadCount: member.unreadCount + 1,
            }),
          ),
      );

      newMessageIds.push(newMessageId);
    }

    return newMessageIds;
  },
});

// ============================================================================
// CONVERSATIONS DISPONIBLES POUR LE TRANSFERT
// ============================================================================

export const getForwardTargets = query({
  args: {},

  handler: async (ctx) => {
    const user = await requireAuthenticatedUser(ctx);

    // Récupérer toutes les conversations auxquelles
    // l'utilisateur appartient.
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const conversations = await Promise.all(
      memberships.map(async (membership) => {
        const conversation = await ctx.db.get(membership.conversationId);

        if (!conversation) {
          return null;
        }

        // --------------------------------------------------------------------
        // Conversation de groupe
        // --------------------------------------------------------------------

        if (conversation.isGroup) {
          return {
            conversationId: conversation._id,
            isGroup: true,
            name: conversation.groupName ?? "Groupe",
            avatar: conversation.groupAvatar ?? null,
            otherParticipant: null,
          };
        }

        // --------------------------------------------------------------------
        // Conversation privée
        // --------------------------------------------------------------------

        const otherUserId = conversation.participantIds.find(
          (participantId) => participantId !== user._id,
        );

        if (!otherUserId) {
          return {
            conversationId: conversation._id,
            isGroup: false,
            name: "Conversation",
            avatar: null,
            otherParticipant: null,
          };
        }

        const otherUser = await ctx.db.get(otherUserId);

        return {
          conversationId: conversation._id,
          isGroup: false,
          name: otherUser?.name ?? "Utilisateur",
          avatar: otherUser?.avatar ?? null,
          otherParticipant: otherUser
            ? {
                _id: otherUser._id,
                name: otherUser.name,
                avatar: otherUser.avatar,
              }
            : null,
        };
      }),
    );

    return conversations.filter(
      (conversation): conversation is NonNullable<typeof conversation> =>
        conversation !== null,
    );
  },
});
