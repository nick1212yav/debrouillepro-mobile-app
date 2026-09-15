// convex/contacts.ts

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function requireUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

/**
 * Rechercher les utilisateurs partageables comme contacts.
 */
export const search = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx);

    const query = (args.search ?? "").trim().toLowerCase();

    const limit = Math.min(Math.max(args.limit ?? 30, 1), 100);

    let users = await ctx.db.query("users").collect();

    users = users.filter((user) => user._id !== currentUser._id);

    if (query) {
      users = users.filter((user) => {
        const name = user.name?.toLowerCase() ?? "";

        const email = user.email?.toLowerCase() ?? "";

        const phone = user.phone?.toLowerCase() ?? "";

        const city = user.city?.toLowerCase() ?? "";

        const profession = user.profession?.toLowerCase() ?? "";

        return (
          name.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          city.includes(query) ||
          profession.includes(query)
        );
      });
    }

    users = users
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .slice(0, limit);

    return users.map((user) => ({
      _id: user._id,
      _creationTime: user._creationTime,

      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,

      city: user.city,
      country: user.country,
      profession: user.profession,
      bio: user.bio,

      isOnline: false,
    }));
  },
});

/**
 * Récupérer un contact précis.
 */
export const get = query({
  args: {
    userId: v.id("users"),
  },

  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      _creationTime: user._creationTime,

      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,

      city: user.city,
      country: user.country,
      profession: user.profession,
      bio: user.bio,

      isOnline: false,
    };
  },
});

/**
 * Créer un vrai message de type "contact".
 *
 * Les données essentielles du contact sont
 * snapshotées dans metadata afin que le message
 * reste correct même si le profil évolue plus tard.
 */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),

    contactId: v.id("users"),

    message: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const sender = await requireUser(ctx);

    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Conversation introuvable",
      });
    }

    if (!conversation.participantIds.includes(sender._id)) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne faites pas partie de cette conversation",
      });
    }

    const contact = await ctx.db.get(args.contactId);

    if (!contact) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Contact introuvable",
      });
    }

    const text = args.message?.trim() || `👤 ${contact.name}`;

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,

      senderId: sender._id,

      text,

      type: "contact",

      status: "sent",

      reactions: [],

      metadata: {
        type: "contact",

        contactId: contact._id,

        name: contact.name,

        phone: contact.phone,

        avatar: contact.avatar,

        email: contact.email,

        profession: contact.profession,

        city: contact.city,
      },
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageText: text,
      lastMessageSenderId: sender._id,
      updatedAt: new Date().toISOString(),
    });

    const members = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    await Promise.all(
      members
        .filter((member) => member.userId !== sender._id)
        .map((member) =>
          ctx.db.patch(member._id, {
            unreadCount: member.unreadCount + 1,
          }),
        ),
    );

    return messageId;
  },
});
