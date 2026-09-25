// convex/messages/members.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Retourne l'utilisateur actuellement authentifié.
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

// ============================================================================
// CONVERSATION
// ============================================================================

/**
 * Récupère une conversation et vérifie qu'elle existe.
 */
async function getConversation(
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"conversations">,
): Promise<Doc<"conversations">> {
  const conversation = await ctx.db.get(conversationId);

  if (!conversation) {
    throw new Error("CONVERSATION_NOT_FOUND");
  }

  return conversation;
}

/**
 * Vérifie qu'un utilisateur est membre de la conversation.
 *
 * participantIds sert de fallback pour les anciennes conversations
 * qui pourraient ne pas encore avoir de document conversationMembers.
 */
async function requireMembership(
  ctx: QueryCtx | MutationCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
): Promise<{
  conversation: Doc<"conversations">;
  member: Doc<"conversationMembers"> | null;
}> {
  const conversation = await getConversation(ctx, conversationId);

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

  return {
    conversation,
    member,
  };
}

/**
 * Vérifie qu'un utilisateur existe.
 */
async function requireUser(ctx: any, userId: Id<"users">) {
  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
}

// ============================================================================
// GET MEMBER
// ============================================================================

/**
 * Récupère le membership d'un utilisateur dans une conversation.
 */
export const get = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireMembership(ctx, args.conversationId, currentUser._id);

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      return null;
    }

    const user = await ctx.db.get(member.userId);

    return {
      ...member,
      user,
    };
  },
});

// ============================================================================
// GET CURRENT USER MEMBERSHIP
// ============================================================================

/**
 * Récupère le membership de l'utilisateur connecté.
 */
export const getCurrent = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const result = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    if (!result.member) {
      return {
        conversationId: args.conversationId,
        userId: currentUser._id,
        unreadCount: 0,
      };
    }

    return result.member;
  },
});

// ============================================================================
// LIST MEMBERS
// ============================================================================

/**
 * Retourne tous les membres d'une conversation.
 *
 * Les membres sont enrichis avec leurs informations utilisateur.
 */
export const list = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const result: Array<
      Partial<Doc<"conversationMembers">> & {
        conversationId: Id<"conversations">;
        userId: Id<"users">;
        unreadCount: number;
        user: Doc<"users">;
      }
    > = [];

    for (const member of members) {
      const user = await ctx.db.get(member.userId);

      if (!user) {
        continue;
      }

      result.push({
        ...member,
        user,
      });
    }

    // ------------------------------------------------------------------------
    // Compatibilité avec les anciennes conversations
    //
    // Si participantIds contient un utilisateur absent de
    // conversationMembers, on le retourne quand même.
    // ------------------------------------------------------------------------

    for (const participantId of conversation.participantIds) {
      const alreadyIncluded = result.some(
        (member) => member.userId === participantId,
      );

      if (alreadyIncluded) {
        continue;
      }

      const user = await ctx.db.get(participantId);

      if (!user) {
        continue;
      }

      result.push({
        conversationId: args.conversationId,
        userId: participantId,
        unreadCount: 0,
        user,
      });
    }

    return result;
  },
});

// ============================================================================
// COUNT MEMBERS
// ============================================================================

/**
 * Nombre de membres d'une conversation.
 */
export const count = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const memberIds = new Set(members.map((member) => String(member.userId)));

    // Compatibilité anciennes conversations.
    for (const participantId of conversation.participantIds) {
      memberIds.add(String(participantId));
    }

    return memberIds.size;
  },
});

// ============================================================================
// IS MEMBER
// ============================================================================

/**
 * Vérifie si un utilisateur appartient à une conversation.
 */
export const isMember = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireMembership(ctx, args.conversationId, currentUser._id);

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      return false;
    }

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId),
      )
      .unique();

    if (member) {
      return true;
    }

    return conversation.participantIds.some(
      (participantId: Id<"users">) => participantId === args.userId,
    );
  },
});

// ============================================================================
// ADD MEMBER
// ============================================================================

/**
 * Ajoute un utilisateur à un groupe.
 *
 * Les conversations privées ne peuvent pas recevoir un troisième membre.
 *
 * Le schéma actuel ne possède pas de rôle/admin au niveau des groupes.
 * Par conséquent, tout membre existant peut inviter un autre utilisateur.
 */
export const add = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    if (!conversation.isGroup) {
      throw new Error("CANNOT_ADD_MEMBER_TO_DIRECT_CONVERSATION");
    }

    // Vérifier que l'utilisateur à ajouter existe.
    await requireUser(ctx, args.userId);

    // Éviter les doublons.
    const alreadyParticipant = conversation.participantIds.some(
      (participantId: Id<"users">) => participantId === args.userId,
    );

    if (alreadyParticipant) {
      return {
        success: true,
        alreadyMember: true,
        conversationId: args.conversationId,
        userId: args.userId,
      };
    }

    // ------------------------------------------------------------------------
    // Vérifier également conversationMembers
    // ------------------------------------------------------------------------

    const existingMember = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId),
      )
      .unique();

    if (existingMember) {
      return {
        success: true,
        alreadyMember: true,
        conversationId: args.conversationId,
        userId: args.userId,
      };
    }

    // ------------------------------------------------------------------------
    // Ajouter le membership
    // ------------------------------------------------------------------------

    await ctx.db.insert("conversationMembers", {
      conversationId: args.conversationId,
      userId: args.userId,
      unreadCount: 0,
      role: "member",
      isMuted: false,
    });

    // ------------------------------------------------------------------------
    // Synchroniser participantIds
    // ------------------------------------------------------------------------

    await ctx.db.patch(args.conversationId, {
      participantIds: [...conversation.participantIds, args.userId],
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      alreadyMember: false,
      conversationId: args.conversationId,
      userId: args.userId,
    };
  },
});

// ============================================================================
// ADD MULTIPLE MEMBERS
// ============================================================================

/**
 * Ajoute plusieurs utilisateurs à un groupe.
 *
 * Les doublons sont automatiquement ignorés.
 */
export const addMany = mutation({
  args: {
    conversationId: v.id("conversations"),
    userIds: v.array(v.id("users")),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    if (!conversation.isGroup) {
      throw new Error("CANNOT_ADD_MEMBER_TO_DIRECT_CONVERSATION");
    }

    const uniqueUserIds = Array.from(new Set(args.userIds.map(String))).map(
      (id) => id as Id<"users">,
    );

    const added: Id<"users">[] = [];
    const alreadyMembers: Id<"users">[] = [];

    let participantIds = [...conversation.participantIds];

    for (const userId of uniqueUserIds) {
      if (userId === currentUser._id) {
        alreadyMembers.push(userId);
        continue;
      }

      await requireUser(ctx, userId);

      const alreadyParticipant = participantIds.some(
        (participantId: Id<"users">) => participantId === userId,
      );

      if (alreadyParticipant) {
        alreadyMembers.push(userId);
        continue;
      }

      const existingMember = await ctx.db
        .query("conversationMembers")
        .withIndex("by_user_and_conversation", (q) =>
          q.eq("userId", userId).eq("conversationId", args.conversationId),
        )
        .unique();

      if (existingMember) {
        alreadyMembers.push(userId);

        if (!participantIds.some((participantId) => participantId === userId)) {
          participantIds.push(userId);
        }

        continue;
      }

      await ctx.db.insert("conversationMembers", {
        conversationId: args.conversationId,
        userId,
        unreadCount: 0,
        role: "member",
        isMuted: false,
      });

      participantIds.push(userId);
      added.push(userId);
    }

    // ------------------------------------------------------------------------
    // Synchronisation de la conversation
    // ------------------------------------------------------------------------

    if (added.length > 0) {
      await ctx.db.patch(args.conversationId, {
        participantIds,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      added,
      alreadyMembers,
    };
  },
});

// ============================================================================
// REMOVE MEMBER
// ============================================================================

/**
 * Retire un utilisateur d'un groupe.
 *
 * Pour des raisons de sécurité et parce que le schéma actuel ne contient
 * aucun champ "adminId" ou "role" dans conversationMembers :
 *
 * - un utilisateur peut toujours se retirer lui-même ;
 * - un membre ne peut pas retirer arbitrairement un autre membre.
 *
 * La gestion des administrateurs pourra être ajoutée plus tard au schéma.
 */
export const remove = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    if (!conversation.isGroup) {
      throw new Error("CANNOT_REMOVE_MEMBER_FROM_DIRECT_CONVERSATION");
    }

    if (args.userId !== currentUser._id) {
      throw new Error("ONLY_SELF_REMOVAL_ALLOWED");
    }

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId),
      )
      .unique();

    if (member) {
      await ctx.db.delete(member._id);
    }

    const remainingParticipants = conversation.participantIds.filter(
      (participantId: Id<"users">) => participantId !== args.userId,
    );

    await ctx.db.patch(args.conversationId, {
      participantIds: remainingParticipants,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      conversationId: args.conversationId,
      userId: args.userId,
    };
  },
});

// ============================================================================
// LEAVE
// ============================================================================

/**
 * Quitte une conversation.
 *
 * C'est un alias métier plus clair que remove() lorsqu'un utilisateur
 * quitte lui-même un groupe.
 */
export const leave = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId),
      )
      .unique();

    if (member) {
      await ctx.db.delete(member._id);
    }

    const remainingParticipants = conversation.participantIds.filter(
      (participantId: Id<"users">) => participantId !== currentUser._id,
    );

    await ctx.db.patch(args.conversationId, {
      participantIds: remainingParticipants,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      conversationId: args.conversationId,
      userId: currentUser._id,
    };
  },
});

// ============================================================================
// ENSURE MEMBER
// ============================================================================

/**
 * Synchronise un membership.
 *
 * Très utile pour les anciennes conversations créées avant
 * l'introduction de conversationMembers.
 */
export const ensure = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.optional(v.id("users")),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const userId = args.userId ?? currentUser._id;

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    // L'utilisateur doit faire partie des participants historiques.
    const participant = conversation.participantIds.some(
      (participantId: Id<"users">) => participantId === userId,
    );

    if (!participant) {
      throw new Error("USER_NOT_A_CONVERSATION_PARTICIPANT");
    }

    const existingMember = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", userId).eq("conversationId", args.conversationId),
      )
      .unique();

    if (existingMember) {
      return {
        created: false,
        member: existingMember,
      };
    }

    const memberId = await ctx.db.insert("conversationMembers", {
      conversationId: args.conversationId,
      userId,
      unreadCount: 0,
      role: "member",
      isMuted: false,
    });

    const member = await ctx.db.get(memberId);

    if (!member) {
      throw new Error("MEMBER_CREATION_FAILED");
    }

    return {
      created: true,
      member,
    };
  },
});

// ============================================================================
// UNREAD COUNT
// ============================================================================

/**
 * Retourne le nombre de messages non lus d'un membre.
 */
export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { member } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    return member?.unreadCount ?? 0;
  },
});

// ============================================================================
// INCREMENT UNREAD COUNT
// ============================================================================

/**
 * Incrémente le compteur de messages non lus.
 *
 * Cette fonction est principalement destinée aux mutations internes
 * de messagerie.
 */
export const incrementUnread = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    amount: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireMembership(ctx, args.conversationId, currentUser._id);

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", args.userId).eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    const amount = args.amount ?? 1;

    if (amount < 0) {
      throw new Error("INVALID_INCREMENT");
    }

    await ctx.db.patch(member._id, {
      unreadCount: member.unreadCount + amount,
    });

    return {
      success: true,
      unreadCount: member.unreadCount + amount,
    };
  },
});

// ============================================================================
// SET UNREAD COUNT
// ============================================================================

/**
 * Définit explicitement le nombre de messages non lus.
 *
 * Cette opération est protégée : l'utilisateur connecté ne peut modifier
 * que son propre compteur.
 */
export const setUnreadCount = mutation({
  args: {
    conversationId: v.id("conversations"),
    unreadCount: v.number(),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireMembership(ctx, args.conversationId, currentUser._id);

    if (args.unreadCount < 0) {
      throw new Error("INVALID_UNREAD_COUNT");
    }

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      throw new Error("MEMBER_NOT_FOUND");
    }

    await ctx.db.patch(member._id, {
      unreadCount: args.unreadCount,
    });

    return {
      success: true,
      unreadCount: args.unreadCount,
    };
  },
});

// ============================================================================
// MARK AS READ
// ============================================================================

/**
 * Remet le compteur de messages non lus à zéro.
 */
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    await requireMembership(ctx, args.conversationId, currentUser._id);

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q
          .eq("userId", currentUser._id)
          .eq("conversationId", args.conversationId),
      )
      .unique();

    if (!member) {
      return {
        success: true,
        unreadCount: 0,
      };
    }

    if (member.unreadCount !== 0) {
      await ctx.db.patch(member._id, {
        unreadCount: 0,
      });
    }

    return {
      success: true,
      unreadCount: 0,
    };
  },
});

// ============================================================================
// SYNC MEMBERS
// ============================================================================

/**
 * Synchronise conversationMembers avec participantIds.
 *
 * Cette mutation est utile pour migrer progressivement les conversations
 * existantes vers la nouvelle architecture.
 *
 * Elle :
 * - crée les memberships manquants ;
 * - ne supprime pas les memberships existants ;
 * - conserve les unreadCount existants.
 */
export const sync = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const { conversation } = await requireMembership(
      ctx,
      args.conversationId,
      currentUser._id,
    );

    const existingMembers = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const existingUserIds = new Set(
      existingMembers.map((member) => String(member.userId)),
    );

    const created: Id<"users">[] = [];

    for (const userId of conversation.participantIds) {
      if (existingUserIds.has(String(userId))) {
        continue;
      }

      const user = await ctx.db.get(userId);

      if (!user) {
        continue;
      }

      await ctx.db.insert("conversationMembers", {
        conversationId: args.conversationId,
        userId,
        unreadCount: 0,
        role: "member",
        isMuted: false,
      });

      created.push(userId);
    }

    return {
      success: true,
      created,
      existingCount: existingMembers.length,
      totalParticipants: conversation.participantIds.length,
    };
  },
});
