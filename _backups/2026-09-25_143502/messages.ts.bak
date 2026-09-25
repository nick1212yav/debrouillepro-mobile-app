// convex/messages.ts

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { buildUserSearchText } from "./lib/userSearch";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function requireUser(ctx: {
  auth: {
    getUserIdentity: () => Promise<{ tokenIdentifier: string } | null>;
  };
  db: import("./_generated/server").DatabaseReader;
}) {
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

// ── Queries ───────────────────────────────────────────────────────────────────

/** List all conversations for the current user, ordered by most recent */
export const listConversations = query({
  args: {},

  handler: async (
    ctx,
  ): Promise<
    Array<{
      conversationId: Id<"conversations">;
      isGroup: boolean;
      groupName?: string;
      groupAvatar?: string;
      lastMessageText?: string;
      lastMessageSenderId?: Id<"users">;
      updatedAt: string;
      unreadCount: number;
      otherParticipant?: {
        _id: Id<"users">;
        name?: string;
        avatar?: string;
      };
      participantIds: Id<"users">[];
    }>
  > => {
    const user = await requireUser(ctx);

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = await Promise.all(
      memberships.map(async (m) => {
        const conv = await ctx.db.get(m.conversationId);

        if (!conv) return null;

        let otherParticipant:
          | {
              _id: Id<"users">;
              name?: string;
              avatar?: string;
            }
          | undefined;

        if (!conv.isGroup) {
          const otherId = conv.participantIds.find((id) => id !== user._id);

          if (otherId) {
            const other = await ctx.db.get(otherId);

            if (other) {
              otherParticipant = {
                _id: other._id,
                name: other.name,
                avatar: other.avatar,
              };
            }
          }
        }

        return {
          conversationId: conv._id,
          isGroup: conv.isGroup,
          groupName: conv.groupName,
          groupAvatar: conv.groupAvatar,
          lastMessageText: conv.lastMessageText,
          lastMessageSenderId: conv.lastMessageSenderId,
          updatedAt: conv.updatedAt,
          unreadCount: m.unreadCount,
          otherParticipant,
          participantIds: conv.participantIds,
        };
      }),
    );

    return results
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  },
});

/** Get messages for a conversation (last 100) */
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (
    ctx,
    args,
  ): Promise<
    Array<{
      _id: Id<"messages">;
      _creationTime: number;
      text: string;
      senderId: Id<"users">;
      senderName?: string;
      status: "sent" | "delivered" | "read" | "failed";
      reactions: Array<{
        emoji: string;
        count: number;
      }>;
      isMe: boolean;
      replyToId?: Id<"messages">;
      replyPreview?: {
        text: string;
        senderName?: string;
      } | null;
      sharedPublicationId?: Id<"publications">;
      sharedPublication?: {
        title: string;
        type: string;
        description: string;
      } | null;
    }>
  > => {
    const user = await requireUser(ctx);

    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .take(100);

    return await Promise.all(
      msgs.map(async (m) => {
        const sender =
          m.senderId !== user._id ? await ctx.db.get(m.senderId) : null;

        const senderName = sender?.name;

        let replyPreview: {
          text: string;
          senderName?: string;
        } | null = null;

        if (m.replyToId) {
          const replied = await ctx.db.get(m.replyToId);

          if (replied) {
            const repliedSender = await ctx.db.get(replied.senderId);

            replyPreview = {
              text: replied.text,
              senderName: repliedSender?.name,
            };
          }
        }

        let sharedPublication: {
          title: string;
          type: string;
          description: string;
        } | null = null;

        if (m.sharedPublicationId) {
          const pub = await ctx.db.get(m.sharedPublicationId);

          if (pub) {
            sharedPublication = {
              title: pub.title,
              type: pub.type,
              description: pub.description,
            };
          }
        }

        return {
          _id: m._id,
          _creationTime: m._creationTime,
          text: m.text,
          senderId: m.senderId,
          senderName,
          status: m.status,
          reactions: m.reactions,
          isMe: m.senderId === user._id,
          replyToId: m.replyToId,
          replyPreview,
          sharedPublicationId: m.sharedPublicationId,
          sharedPublication,
        };
      }),
    );
  },
});

/** Total unread across all conversations */
export const totalUnread = query({
  args: {},

  handler: async (ctx): Promise<number> => {
    const user = await requireUser(ctx);

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return memberships.reduce((sum, member) => sum + member.unreadCount, 0);
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────────

/** Send a message in a conversation */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    text: v.string(),
    replyToId: v.optional(v.id("messages")),
    sharedPublicationId: v.optional(v.id("publications")),
  },

  handler: async (ctx, args): Promise<Id<"messages">> => {
    const user = await requireUser(ctx);

    const text = args.text.trim();

    if (!text) {
      throw new ConvexError({
        message: "Le message ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    const msgId = await ctx.db.insert("messages", {
      type: "text",
      conversationId: args.conversationId,
      senderId: user._id,
      text,
      status: "sent",
      reactions: [],
      replyToId: args.replyToId,
      sharedPublicationId: args.sharedPublicationId,
    });

    const now = new Date().toISOString();

    await ctx.db.patch(args.conversationId, {
      lastMessageText: text,
      lastMessageSenderId: user._id,
      updatedAt: now,
    });

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

    const typingRow = await ctx.db
      .query("typingStatus")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (typingRow) {
      await ctx.db.delete(typingRow._id);
    }

    return msgId;
  },
});

/** Mark a conversation as read for the current user */
export const markMessageRead = mutation({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const member = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (member && member.unreadCount > 0) {
      await ctx.db.patch(member._id, {
        unreadCount: 0,
      });
    }
  },
});

/** Add or increment a reaction on a message */
export const reactToMessage = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },

  handler: async (ctx, args): Promise<void> => {
    const msg = await ctx.db.get(args.messageId);

    if (!msg) {
      throw new ConvexError({
        message: "Message introuvable",
        code: "NOT_FOUND",
      });
    }

    const existing = msg.reactions.find((r) => r.emoji === args.emoji);

    const reactions = existing
      ? msg.reactions.map((r) =>
          r.emoji === args.emoji
            ? {
                ...r,
                count: r.count + 1,
              }
            : r,
        )
      : [
          ...msg.reactions,
          {
            type: "text",
            emoji: args.emoji,
            count: 1,
          },
        ];

    await ctx.db.patch(args.messageId, {
      reactions,
    });
  },
});

/** Create or open a 1-on-1 conversation */
export const getOrCreateDirectConversation = mutation({
  args: {
    otherUserId: v.id("users"),
  },

  handler: async (ctx, args): Promise<Id<"conversations">> => {
    const user = await requireUser(ctx);

    if (user._id === args.otherUserId) {
      throw new ConvexError({
        message: "Vous ne pouvez pas créer une conversation avec vous-même",
        code: "FORBIDDEN",
      });
    }

    const myMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const membership of myMemberships) {
      const conv = await ctx.db.get(membership.conversationId);

      if (!conv || conv.isGroup) continue;

      if (conv.participantIds.includes(args.otherUserId)) {
        return conv._id;
      }
    }

    const now = new Date().toISOString();

    const convId = await ctx.db.insert("conversations", {
      participantIds: [user._id, args.otherUserId],
      isGroup: false,
      updatedAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: convId,
      userId: user._id,
      unreadCount: 0,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: convId,
      userId: args.otherUserId,
      unreadCount: 0,
    });

    return convId;
  },
});

/**
 * Create or retrieve a conversation with
 * an initial message and optional shared publication.
 */
export const getOrCreateConversation = mutation({
  args: {
    participantId: v.id("users"),
    initialMessage: v.string(),
    publicationId: v.optional(v.id("publications")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user._id === args.participantId) {
      throw new ConvexError({
        message: "Vous ne pouvez pas vous envoyer un message à vous-même",
        code: "FORBIDDEN",
      });
    }

    const initialMessage = args.initialMessage.trim();

    if (!initialMessage) {
      throw new ConvexError({
        message: "Le message initial ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    const existing = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.eq(q.field("isGroup"), false),
          q.eq(q.field("participantIds"), [user._id, args.participantId]),
        ),
      )
      .first();

    if (existing) {
      const messageId = await ctx.db.insert("messages", {
        type: "text",
        conversationId: existing._id,
        senderId: user._id,
        text: initialMessage,
        status: "sent",
        reactions: [],
        sharedPublicationId: args.publicationId,
      });

      await ctx.db.patch(existing._id, {
        lastMessageText: initialMessage,
        lastMessageSenderId: user._id,
        updatedAt: new Date().toISOString(),
      });

      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", existing._id),
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

      return {
        conversationId: existing._id,
        isNew: false,
        messageId,
      };
    }

    const now = new Date().toISOString();

    const convId = await ctx.db.insert("conversations", {
      participantIds: [user._id, args.participantId],
      isGroup: false,
      lastMessageText: initialMessage,
      lastMessageSenderId: user._id,
      updatedAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: convId,
      userId: user._id,
      unreadCount: 0,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: convId,
      userId: args.participantId,
      unreadCount: 1,
    });

    const messageId = await ctx.db.insert("messages", {
      type: "text",
      conversationId: convId,
      senderId: user._id,
      text: initialMessage,
      status: "sent",
      reactions: [],
      sharedPublicationId: args.publicationId,
    });

    return {
      conversationId: convId,
      isNew: true,
      messageId,
    };
  },
});

/** Create a group conversation */
export const createGroup = mutation({
  args: {
    groupName: v.string(),
    groupAvatar: v.optional(v.string()),
    participantIds: v.array(v.id("users")),
  },

  handler: async (ctx, args): Promise<Id<"conversations">> => {
    const user = await requireUser(ctx);

    const groupName = args.groupName.trim();

    if (!groupName) {
      throw new ConvexError({
        message: "Le nom du groupe ne peut pas être vide",
        code: "INVALID_ARGUMENT",
      });
    }

    const now = new Date().toISOString();

    const allParticipants = [
      user._id,
      ...args.participantIds.filter((id) => id !== user._id),
    ];

    const uniqueParticipants = Array.from(new Set(allParticipants));

    if (uniqueParticipants.length < 2) {
      throw new ConvexError({
        message: "Un groupe doit avoir au moins deux participants",
        code: "INVALID_ARGUMENT",
      });
    }

    const convId = await ctx.db.insert("conversations", {
      participantIds: uniqueParticipants,
      isGroup: true,
      groupName,
      groupAvatar: args.groupAvatar,
      updatedAt: now,
    });

    await Promise.all(
      uniqueParticipants.map((uid) =>
        ctx.db.insert("conversationMembers", {
          role: "member",
          isMuted: false,
          conversationId: convId,
          userId: uid,
          unreadCount: 0,
        }),
      ),
    );

    return convId;
  },
});

// ── Seed demo conversations ────────────────────────────────────────────────────

export const seedDemoConversations = mutation({
  args: {},

  handler: async (ctx): Promise<void> => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("conversationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(1);

    if (existing.length > 0) {
      return;
    }

    const now = Date.now();

    const demoUser1 = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", "demo-user-1"))
      .unique();

    let demoUserId1: Id<"users">;

    if (!demoUser1) {
      const demoUserSearchText = buildUserSearchText({
        name: "Démo",
        roles: ["user"],
      });

      demoUserId1 = await ctx.db.insert("users", {
        uid: "demo-user-1",
        tokenIdentifier: "demo-user-1",
        name: "Démo",
        email: "demo@debrouille.pro",
        avatar: "/demo/avatar1.jpg",
        roles: ["user"],
        emailVerified: true,
        onboardingCompleted: true,
        reputationScore: 0,
        searchText: demoUserSearchText,
      });
    } else {
      demoUserId1 = demoUser1._id;
    }

    const demoUser2 = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", "demo-user-2"))
      .unique();

    let demoUserId2: Id<"users">;

    if (!demoUser2) {
      const marieSearchText = buildUserSearchText({
        name: "Marie",
        roles: ["user"],
      });

      demoUserId2 = await ctx.db.insert("users", {
        uid: "demo-user-2",
        tokenIdentifier: "demo-user-2",
        name: "Marie",
        email: "marie@debrouille.pro",
        avatar: "/demo/avatar2.jpg",
        roles: ["user"],
        emailVerified: true,
        onboardingCompleted: true,
        reputationScore: 0,
        searchText: marieSearchText,
      });
    } else {
      demoUserId2 = demoUser2._id;
    }

    // ── Conversation privée avec Démo ──

    const dmId1 = await ctx.db.insert("conversations", {
      participantIds: [user._id, demoUserId1],
      isGroup: false,
      updatedAt: new Date(now - 120_000).toISOString(),
      lastMessageText: "Votre ordonnance est prête ✅",
      lastMessageSenderId: demoUserId1,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: dmId1,
      userId: user._id,
      unreadCount: 2,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: dmId1,
      userId: demoUserId1,
      unreadCount: 0,
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: dmId1,
      senderId: user._id,
      text: "Bonjour Docteur, j'ai eu les résultats d'analyse",
      status: "read",
      reactions: [],
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: dmId1,
      senderId: demoUserId1,
      text: "Votre ordonnance est prête ✅",
      status: "read",
      reactions: [
        {
          emoji: "✅",
          count: 1,
        },
      ],
    });

    // ── Conversation privée avec Marie ──

    const dmId2 = await ctx.db.insert("conversations", {
      participantIds: [user._id, demoUserId2],
      isGroup: false,
      updatedAt: new Date(now - 60_000).toISOString(),
      lastMessageText: "On se voit à 14h ? 😊",
      lastMessageSenderId: demoUserId2,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: dmId2,
      userId: user._id,
      unreadCount: 1,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: dmId2,
      userId: demoUserId2,
      unreadCount: 0,
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: dmId2,
      senderId: user._id,
      text: "Salut Marie, tu passes à la réunion ?",
      status: "read",
      reactions: [],
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: dmId2,
      senderId: demoUserId2,
      text: "Oui, j'arrive dans 10 min ! 👋",
      status: "delivered",
      reactions: [],
    });

    // ── Groupe : Kolwezi Entraide ──

    const groupId = await ctx.db.insert("conversations", {
      participantIds: [user._id, demoUserId1, demoUserId2],
      isGroup: true,
      groupName: "Kolwezi Entraide",
      groupAvatar: "/demo/group1.jpg",
      updatedAt: new Date(now).toISOString(),
      lastMessageText: "Bienvenue dans le groupe Kolwezi Entraide ! 🎉",
      lastMessageSenderId: user._id,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: groupId,
      userId: user._id,
      unreadCount: 0,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: groupId,
      userId: demoUserId1,
      unreadCount: 3,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: groupId,
      userId: demoUserId2,
      unreadCount: 2,
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: groupId,
      senderId: user._id,
      text: "Bienvenue dans le groupe Kolwezi Entraide ! 🎉",
      status: "read",
      reactions: [
        {
          emoji: "🎉",
          count: 5,
        },
      ],
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: groupId,
      senderId: demoUserId1,
      text: "Merci ! Content d'être là 🙌",
      status: "read",
      reactions: [
        {
          emoji: "❤️",
          count: 2,
        },
      ],
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: groupId,
      senderId: demoUserId2,
      text: "Super initiative ! On va bien bosser ensemble 💪",
      status: "delivered",
      reactions: [],
    });

    // ── Groupe : Famille ──

    const familyId = await ctx.db.insert("conversations", {
      participantIds: [user._id, demoUserId1],
      isGroup: true,
      groupName: "Famille 🏠",
      groupAvatar: "/demo/group2.jpg",
      updatedAt: new Date(now - 30_000).toISOString(),
      lastMessageText: "Bon anniversaire ! 🎂",
      lastMessageSenderId: demoUserId1,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: familyId,
      userId: user._id,
      unreadCount: 2,
    });

    await ctx.db.insert("conversationMembers", {
      role: "member",
      isMuted: false,
      conversationId: familyId,
      userId: demoUserId1,
      unreadCount: 0,
    });

    await ctx.db.insert("messages", {
      type: "text",
      conversationId: familyId,
      senderId: demoUserId1,
      text: "Bon anniversaire ! 🎂",
      status: "delivered",
      reactions: [],
    });
  },
});

// ── Typing status ──────────────────────────────────────────────────────────────

/** Set typing status for the current user in a conversation */
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },

  handler: async (ctx, args): Promise<void> => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .unique();

    if (args.isTyping) {
      const now = new Date().toISOString();

      if (existing) {
        await ctx.db.patch(existing._id, {
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("typingStatus", {
          conversationId: args.conversationId,
          userId: user._id,
          updatedAt: now,
        });
      }
    } else if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/** Get names of users currently typing in a conversation (< 5s old) */
export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args): Promise<string[]> => {
    const user = await requireUser(ctx);

    const cutoff = new Date(Date.now() - 5000).toISOString();

    const rows = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const active = rows.filter(
      (r) => r.userId !== user._id && r.updatedAt > cutoff,
    );

    const names = await Promise.all(
      active.map(async (r) => {
        const u = await ctx.db.get(r.userId);

        return u?.name ?? "Quelqu'un";
      }),
    );

    return names;
  },
});
