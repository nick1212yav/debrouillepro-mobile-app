// convex/messages/ai.ts

import { ConvexError, v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

type AIAction =
  | "summarize"
  | "translate"
  | "rewrite"
  | "improve"
  | "shorten"
  | "expand"
  | "reply";

// ============================================================================
// HELPERS
// ============================================================================

async function requireUser(ctx: any): Promise<Doc<"users">> {
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

async function requireConversationMember(
  ctx: any,
  userId: Id<"users">,
  conversationId: Id<"conversations">,
) {
  const member = await ctx.db
    .query("conversationMembers")
    .withIndex("by_user_conversation", (q: any) =>
      q.eq("userId", userId).eq("conversationId", conversationId),
    )
    .unique();

  if (!member) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Vous n'êtes pas membre de cette conversation",
    });
  }

  return member;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function limitText(text: string, maxLength = 12000): string {
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength);
}

// ============================================================================
// 1. CONTEXTE D'UNE CONVERSATION POUR L'IA
// ============================================================================
//
// Retourne les derniers messages utiles à l'IA.
// Aucun champ "isDeleted" n'est utilisé car il n'existe plus
// dans le schéma actuel.
// ============================================================================

export const getConversationAIContext = query({
  args: {
    conversationId: v.id("conversations"),

    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireConversationMember(ctx, user._id, args.conversationId);

    const limit = Math.max(1, Math.min(args.limit ?? 30, 100));

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(limit);

    const filtered = messages
      .filter((message: Doc<"messages">) => message.status !== "failed")
      .reverse();

    return filtered.map((message: Doc<"messages">) => ({
      id: message._id,
      senderId: message.senderId,
      text: message.text,
      status: message.status,
      replyToId: message.replyToId,
      sharedPublicationId: message.sharedPublicationId,
      createdAt: message._creationTime,
    }));
  },
});

// ============================================================================
// 2. CONTEXTE D'UN MESSAGE
// ============================================================================

export const getMessageAIContext = query({
  args: {
    messageId: v.id("messages"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    await requireConversationMember(ctx, user._id, message.conversationId);

    return {
      id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      status: message.status,
      replyToId: message.replyToId,
      sharedPublicationId: message.sharedPublicationId,
      createdAt: message._creationTime,
    };
  },
});

// ============================================================================
// 3. PRÉPARER UNE ACTION IA SUR UN MESSAGE
// ============================================================================
//
// Cette mutation ne fait pas appel directement à un fournisseur IA.
// Elle valide l'utilisateur, le message et l'action demandée.
//
// Le frontend / service IA peut ensuite utiliser le résultat.
// ============================================================================

export const prepareMessageAI = mutation({
  args: {
    messageId: v.id("messages"),

    action: v.union(
      v.literal("summarize"),
      v.literal("translate"),
      v.literal("rewrite"),
      v.literal("improve"),
      v.literal("shorten"),
      v.literal("expand"),
      v.literal("reply"),
    ),

    targetLanguage: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    await requireConversationMember(ctx, user._id, message.conversationId);

    const text = cleanText(message.text);

    if (!text) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Ce message ne contient pas de texte exploitable par l'IA",
      });
    }

    if (args.action === "translate" && !args.targetLanguage?.trim()) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "La langue cible est requise pour une traduction",
      });
    }

    return {
      messageId: message._id,
      conversationId: message.conversationId,
      action: args.action,
      targetLanguage: args.targetLanguage?.trim() || null,
      text: limitText(text),
    };
  },
});

// ============================================================================
// 4. PRÉPARER UNE RÉPONSE IA
// ============================================================================
//
// Retourne le contexte récent nécessaire pour générer une réponse.
// ============================================================================

export const prepareAIReply = query({
  args: {
    conversationId: v.id("conversations"),

    limit: v.optional(v.number()),

    messageId: v.optional(v.id("messages")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireConversationMember(ctx, user._id, args.conversationId);

    const limit = Math.max(1, Math.min(args.limit ?? 20, 50));

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(limit);

    const context = messages
      .filter((message: Doc<"messages">) => message.status !== "failed")
      .reverse()
      .map((message: Doc<"messages">) => ({
        id: message._id,
        senderId: message.senderId,
        text: limitText(cleanText(message.text), 4000),
        createdAt: message._creationTime,
      }));

    return {
      conversationId: args.conversationId,

      requestedBy: user._id,

      messageId: args.messageId ?? null,

      messages: context,
    };
  },
});

// ============================================================================
// 5. PRÉPARER UN RÉSUMÉ DE CONVERSATION
// ============================================================================

export const prepareConversationSummary = query({
  args: {
    conversationId: v.id("conversations"),

    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireConversationMember(ctx, user._id, args.conversationId);

    const limit = Math.max(5, Math.min(args.limit ?? 50, 100));

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(limit);

    const context = messages
      .filter((message: Doc<"messages">) => message.status !== "failed")
      .reverse()
      .map((message: Doc<"messages">) => ({
        id: message._id,
        senderId: message.senderId,
        text: limitText(cleanText(message.text), 4000),
        createdAt: message._creationTime,
      }));

    return {
      conversationId: args.conversationId,

      messageCount: context.length,

      messages: context,
    };
  },
});

// ============================================================================
// 6. EXTRAIRE LE TEXTE POUR TRADUCTION
// ============================================================================

export const prepareTranslation = query({
  args: {
    messageId: v.id("messages"),

    targetLanguage: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    await requireConversationMember(ctx, user._id, message.conversationId);

    const targetLanguage = cleanText(args.targetLanguage);

    if (!targetLanguage) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "La langue cible est requise",
      });
    }

    const text = cleanText(message.text);

    if (!text) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Le message ne contient pas de texte",
      });
    }

    return {
      messageId: message._id,

      conversationId: message.conversationId,

      sourceText: limitText(text),

      targetLanguage,
    };
  },
});

// ============================================================================
// 7. PRÉPARER LA RÉÉCRITURE
// ============================================================================

export const prepareRewrite = query({
  args: {
    messageId: v.id("messages"),

    style: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const message = await ctx.db.get(args.messageId);

    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message introuvable",
      });
    }

    await requireConversationMember(ctx, user._id, message.conversationId);

    const text = cleanText(message.text);

    if (!text) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Le message ne contient pas de texte",
      });
    }

    return {
      messageId: message._id,

      conversationId: message.conversationId,

      sourceText: limitText(text),

      style: args.style?.trim() || "natural",
    };
  },
});

// ============================================================================
// 8. STATISTIQUES IA D'UNE CONVERSATION
// ============================================================================
//
// Cette version reste volontairement légère :
// elle ne nécessite aucune table supplémentaire.
// ============================================================================

export const getAIConversationStats = query({
  args: {
    conversationId: v.id("conversations"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await requireConversationMember(ctx, user._id, args.conversationId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    const validMessages = messages.filter(
      (message: Doc<"messages">) => message.status !== "failed",
    );

    const totalCharacters = validMessages.reduce(
      (total: number, message: Doc<"messages">) => total + message.text.length,
      0,
    );

    return {
      conversationId: args.conversationId,

      messageCount: validMessages.length,

      totalCharacters,

      averageCharacters:
        validMessages.length > 0
          ? Math.round(totalCharacters / validMessages.length)
          : 0,
    };
  },
});
