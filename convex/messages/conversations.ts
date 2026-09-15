// convex/messages/conversations.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retourne l'utilisateur Convex correspondant à l'identité authentifiée.
 *
 * Le schéma users utilise :
 *   tokenIdentifier: v.string()
 *
 * On utilise donc l'index by_token.
 */
async function getCurrentUser(ctx: any): Promise<Doc<"users">> {
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

/**
 * Vérifie qu'un utilisateur fait partie d'une conversation.
 */
async function getConversationMember(
  ctx: any,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
) {
  return await ctx.db
    .query("conversationMembers")
    .withIndex("by_user_and_conversation", (q: any) =>
      q.eq("userId", userId).eq("conversationId", conversationId),
    )
    .unique();
}

/**
 * Vérifie l'accès à une conversation.
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

  const member = await getConversationMember(ctx, conversationId, userId);

  // Compatibilité avec les conversations éventuellement créées
  // avant l'existence de conversationMembers.
  const isParticipant = conversation.participantIds.some(
    (id: Id<"users">) => id === userId,
  );

  if (!member && !isParticipant) {
    throw new Error("FORBIDDEN");
  }

  return conversation;
}

/**
 * Retourne les utilisateurs participants d'une conversation.
 */
async function getParticipants(
  ctx: any,
  participantIds: Id<"users">[],
): Promise<Doc<"users">[]> {
  const users: Doc<"users">[] = [];

  for (const userId of participantIds) {
    const user = await ctx.db.get(userId);

    if (user) {
      users.push(user);
    }
  }

  return users;
}

/**
 * Compare deux tableaux d'IDs sans tenir compte de leur ordre.
 */
function sameParticipants(a: Id<"users">[], b: Id<"users">[]): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const setA = new Set(a.map(String));
  const setB = new Set(b.map(String));

  if (setA.size !== setB.size) {
    return false;
  }

  for (const id of setA) {
    if (!setB.has(id)) {
      return false;
    }
  }

  return true;
}

/**
 * Construit une conversation enrichie pour le frontend.
 */
async function enrichConversation(
  ctx: any,
  conversation: Doc<"conversations">,
) {
  const participants = await getParticipants(ctx, conversation.participantIds);

  const members = [];

  for (const userId of conversation.participantIds) {
    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q: any) =>
        q.eq("userId", userId).eq("conversationId", conversation._id),
      )
      .unique();

    members.push({
      userId,
      unreadCount: member?.unreadCount ?? 0,
    });
  }

  return {
    ...conversation,
    participants,
    members,
  };
}

// ============================================================================
// GET ONE CONVERSATION
// ============================================================================

/**
 * Récupère une conversation précise.
 */
export const get = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const conversation = await requireConversationAccess(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    return await enrichConversation(ctx, conversation);
  },
});

// ============================================================================
// LIST CURRENT USER CONVERSATIONS
// ============================================================================

/**
 * Liste toutes les conversations de l'utilisateur connecté.
 *
 * Tri :
 *   plus récemment modifiée -> plus ancienne
 */
export const list = query({
  args: {},

  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const memberRows = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUser._id))
      .collect();

    const conversations: Array<
      Doc<"conversations"> & {
        participants: Doc<"users">[];
        members: Array<{
          userId: Id<"users">;
          unreadCount: number;
        }>;
      }
    > = [];

    for (const member of memberRows) {
      const conversation = await ctx.db.get(member.conversationId);

      if (!conversation) {
        continue;
      }

      conversations.push(await enrichConversation(ctx, conversation));
    }

    // Compatibilité avec les anciennes conversations qui n'auraient
    // pas encore de ligne dans conversationMembers.
    const legacyConversations = await ctx.db
      .query("conversations")
      .withIndex("by_updatedAt")
      .order("desc")
      .collect();

    for (const conversation of legacyConversations) {
      const isParticipant = conversation.participantIds.some(
        (id) => id === currentUser._id,
      );

      if (!isParticipant) {
        continue;
      }

      const alreadyIncluded = conversations.some(
        (item) => item._id === conversation._id,
      );

      if (!alreadyIncluded) {
        conversations.push(await enrichConversation(ctx, conversation));
      }
    }

    conversations.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

    return conversations;
  },
});

// ============================================================================
// GET DIRECT CONVERSATION
// ============================================================================

/**
 * Cherche une conversation privée entre l'utilisateur connecté
 * et un autre utilisateur.
 *
 * Retourne null si elle n'existe pas.
 */
export const getDirect = query({
  args: {
    otherUserId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (currentUser._id === args.otherUserId) {
      throw new Error("CANNOT_CONVERSE_WITH_SELF");
    }

    const memberRows = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUser._id))
      .collect();

    for (const member of memberRows) {
      const conversation = await ctx.db.get(member.conversationId);

      if (!conversation) {
        continue;
      }

      if (conversation.isGroup) {
        continue;
      }

      if (
        conversation.participantIds.length === 2 &&
        sameParticipants(conversation.participantIds, [
          currentUser._id,
          args.otherUserId,
        ])
      ) {
        return await enrichConversation(ctx, conversation);
      }
    }

    return null;
  },
});

// ============================================================================
// CREATE DIRECT CONVERSATION
// ============================================================================

/**
 * Crée ou retourne une conversation privée existante.
 *
 * Important :
 * on évite de créer plusieurs conversations directes entre
 * les mêmes deux utilisateurs.
 */
export const getOrCreateDirect = mutation({
  args: {
    otherUserId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (currentUser._id === args.otherUserId) {
      throw new Error("CANNOT_CONVERSE_WITH_SELF");
    }

    const otherUser = await ctx.db.get(args.otherUserId);

    if (!otherUser) {
      throw new Error("USER_NOT_FOUND");
    }

    // ------------------------------------------------------------------------
    // Vérifier si la conversation existe déjà
    // ------------------------------------------------------------------------

    const memberRows = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUser._id))
      .collect();

    for (const member of memberRows) {
      const existingConversation = await ctx.db.get(member.conversationId);

      if (!existingConversation) {
        continue;
      }

      if (existingConversation.isGroup) {
        continue;
      }

      if (
        existingConversation.participantIds.length === 2 &&
        sameParticipants(existingConversation.participantIds, [
          currentUser._id,
          args.otherUserId,
        ])
      ) {
        return {
          conversationId: existingConversation._id,
          created: false,
        };
      }
    }

    // ------------------------------------------------------------------------
    // Création
    // ------------------------------------------------------------------------

    const now = new Date().toISOString();

    const conversationId = await ctx.db.insert("conversations", {
      participantIds: [currentUser._id, args.otherUserId],
      isGroup: false,
      updatedAt: now,
    });

    // ------------------------------------------------------------------------
    // Membres
    // ------------------------------------------------------------------------

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: currentUser._id,
      unreadCount: 0,
      role: "member",
      isMuted: false,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.otherUserId,
      unreadCount: 0,
      role: "member",
      isMuted: false,
    });

    return {
      conversationId,
      created: true,
    };
  },
});

// ============================================================================
// CREATE GROUP CONVERSATION
// ============================================================================

/**
 * Crée une conversation de groupe.
 */
export const createGroup = mutation({
  args: {
    participantIds: v.array(v.id("users")),
    groupName: v.string(),
    groupAvatar: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const groupName = args.groupName.trim();

    if (!groupName) {
      throw new Error("GROUP_NAME_REQUIRED");
    }

    // ------------------------------------------------------------------------
    // Nettoyage des participants
    // ------------------------------------------------------------------------

    const uniqueParticipantIds = Array.from(
      new Set([currentUser._id, ...args.participantIds].map(String)),
    ).map((id) => id as Id<"users">);

    if (uniqueParticipantIds.length < 2) {
      throw new Error("GROUP_NEEDS_AT_LEAST_TWO_MEMBERS");
    }

    // ------------------------------------------------------------------------
    // Vérifier que tous les utilisateurs existent
    // ------------------------------------------------------------------------

    for (const userId of uniqueParticipantIds) {
      const user = await ctx.db.get(userId);

      if (!user) {
        throw new Error("PARTICIPANT_NOT_FOUND");
      }
    }

    // ------------------------------------------------------------------------
    // Création conversation
    // ------------------------------------------------------------------------

    const now = new Date().toISOString();

    const conversationId = await ctx.db.insert("conversations", {
      participantIds: uniqueParticipantIds,
      isGroup: true,
      groupName,
      groupAvatar: args.groupAvatar,
      updatedAt: now,
    });

    // ------------------------------------------------------------------------
    // Création des membres
    // ------------------------------------------------------------------------

    for (const userId of uniqueParticipantIds) {
      await ctx.db.insert("conversationMembers", {
        conversationId,
        userId,
        unreadCount: 0,
        role: "member",
        isMuted: false,
      });
    }

    return {
      conversationId,
      created: true,
    };
  },
});

// ============================================================================
// UPDATE GROUP
// ============================================================================

/**
 * Modifie les informations d'un groupe.
 *
 * Pour l'instant, cette fonction modifie uniquement :
 * - groupName
 * - groupAvatar
 *
 * La gestion détaillée des membres reste dans members.ts.
 */
export const updateGroup = mutation({
  args: {
    conversationId: v.id("conversations"),
    groupName: v.optional(v.string()),
    groupAvatar: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const conversation = await requireConversationAccess(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    if (!conversation.isGroup) {
      throw new Error("NOT_A_GROUP");
    }

    const patch: {
      groupName?: string;
      groupAvatar?: string;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (args.groupName !== undefined) {
      const groupName = args.groupName.trim();

      if (!groupName) {
        throw new Error("GROUP_NAME_REQUIRED");
      }

      patch.groupName = groupName;
    }

    if (args.groupAvatar !== undefined) {
      patch.groupAvatar = args.groupAvatar;
    }

    await ctx.db.patch(args.conversationId, patch);

    return await ctx.db.get(args.conversationId);
  },
});

// ============================================================================
// UPDATE LAST MESSAGE
// ============================================================================

/**
 * Met à jour le résumé de la dernière activité de la conversation.
 *
 * Cette fonction sera utilisée par messages.ts lorsqu'un message
 * est envoyé.
 */
export const updateLastMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    lastMessageText: v.optional(v.string()),
    lastMessageSenderId: v.optional(v.id("users")),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireConversationAccess(ctx, args.conversationId, currentUser._id);

    if (
      args.lastMessageSenderId !== undefined &&
      args.lastMessageSenderId !== currentUser._id
    ) {
      const sender = await ctx.db.get(args.lastMessageSenderId);

      if (!sender) {
        throw new Error("SENDER_NOT_FOUND");
      }
    }

    await ctx.db.patch(args.conversationId, {
      lastMessageText: args.lastMessageText,
      lastMessageSenderId: args.lastMessageSenderId,
      updatedAt: new Date().toISOString(),
    });

    return await ctx.db.get(args.conversationId);
  },
});

// ============================================================================
// MARK CONVERSATION AS READ
// ============================================================================

/**
 * Remet le compteur unreadCount de l'utilisateur à zéro.
 */
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const conversation = await requireConversationAccess(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    const member = await getConversationMember(
      ctx,
      conversation._id,
      currentUser._id,
    );

    if (!member) {
      // Compatibilité ancienne conversation sans conversationMembers.
      return {
        success: true,
        unreadCount: 0,
      };
    }

    await ctx.db.patch(member._id, {
      unreadCount: 0,
    });

    return {
      success: true,
      unreadCount: 0,
    };
  },
});

// ============================================================================
// GET UNREAD COUNT
// ============================================================================

/**
 * Retourne le nombre total de messages non lus de l'utilisateur.
 */
export const getUnreadCount = query({
  args: {},

  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", currentUser._id))
      .collect();

    return members.reduce((total, member) => total + member.unreadCount, 0);
  },
});

// ============================================================================
// GET CONVERSATION UNREAD COUNT
// ============================================================================

/**
 * Retourne le nombre de messages non lus dans une conversation.
 */
export const getUnreadCountForConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireConversationAccess(ctx, args.conversationId, currentUser._id);

    const member = await getConversationMember(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    return member?.unreadCount ?? 0;
  },
});

// ============================================================================
// DELETE / LEAVE CONVERSATION
// ============================================================================

/**
 * Quitte une conversation.
 *
 * Pour un groupe :
 *   l'utilisateur est retiré de conversationMembers et de participantIds.
 *
 * Pour une conversation directe :
 *   l'utilisateur est retiré de conversationMembers et de participantIds.
 *
 * La conversation elle-même est conservée afin de ne pas supprimer
 * l'historique des autres participants.
 */
export const leave = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const conversation = await requireConversationAccess(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    // ------------------------------------------------------------------------
    // Supprimer le membre
    // ------------------------------------------------------------------------

    const member = await getConversationMember(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    if (member) {
      await ctx.db.delete(member._id);
    }

    // ------------------------------------------------------------------------
    // Mettre à jour participantIds
    // ------------------------------------------------------------------------

    const remainingParticipants = conversation.participantIds.filter(
      (id: Id<"users">) => id !== currentUser._id,
    );

    await ctx.db.patch(args.conversationId, {
      participantIds: remainingParticipants,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      conversationId: args.conversationId,
    };
  },
});
