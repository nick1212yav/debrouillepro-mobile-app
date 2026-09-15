// convex/messages/pins.ts

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthenticatedUser } from "../auth/helpers";

// ============================================================================
// ÉPINGLER / DÉSÉPINGLER UN MESSAGE
// ============================================================================

export const togglePin = mutation({
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
    // Inverser l'état d'épinglage
    // ------------------------------------------------------------------------

    const currentlyPinned = message.isPinned ?? false;
    const newPinnedState = !currentlyPinned;

    await ctx.db.patch(args.messageId, {
      isPinned: newPinnedState,
    });

    return newPinnedState;
  },
});

// ============================================================================
// RÉCUPÉRER LES MESSAGES ÉPINGLÉS D'UNE CONVERSATION
// ============================================================================

export const getPinnedMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx);

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
    // Récupérer les messages épinglés
    // ------------------------------------------------------------------------

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .filter((q) => q.eq(q.field("isPinned"), true))
      .collect();

    return messages;
  },
});
