import type { Id } from "@/convex/_generated/dataModel";

/**
 * Service IA frontend.
 *
 * IMPORTANT :
 * Le backend Convex actuel prépare et sécurise les contextes IA.
 * Il ne contient pas encore de fournisseur LLM directement.
 *
 * Les services ci-dessous correspondent donc exactement aux
 * fonctions réellement exposées par convex/messages/ai.ts.
 */

export type AIAction =
  | "summarize"
  | "translate"
  | "rewrite"
  | "improve"
  | "shorten"
  | "expand"
  | "reply";

export interface AIMessageContext {
  id: Id<"messages">;
  senderId: Id<"users">;
  text: string;
  status: "sent" | "delivered" | "read" | "failed";
  replyToId?: Id<"messages">;
  sharedPublicationId?: Id<"publications">;
  createdAt: number;
}

export interface PreparedMessageAI {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  action: AIAction;
  targetLanguage: string | null;
  text: string;
}

export interface PreparedReply {
  conversationId: Id<"conversations">;
  requestedBy: Id<"users">;
  messageId: Id<"messages"> | null;
  messages: Array<{
    id: Id<"messages">;
    senderId: Id<"users">;
    text: string;
    createdAt: number;
  }>;
}

export interface PreparedSummary {
  conversationId: Id<"conversations">;
  messageCount: number;
  messages: Array<{
    id: Id<"messages">;
    senderId: Id<"users">;
    text: string;
    createdAt: number;
  }>;
}

export interface PreparedTranslation {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  sourceText: string;
  targetLanguage: string;
}

export interface PreparedRewrite {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  sourceText: string;
  style: string;
}

export interface AIConversationStats {
  conversationId: Id<"conversations">;
  messageCount: number;
  totalCharacters: number;
  averageCharacters: number;
}

export const aiService = {
  /**
   * Prépare une action IA sur un message.
   *
   * La validation réelle est effectuée côté Convex.
   */
  prepareMessageAction(
    prepare: (args: {
      messageId: Id<"messages">;
      action: AIAction;
      targetLanguage?: string;
    }) => unknown,
    args: {
      messageId: Id<"messages">;
      action: AIAction;
      targetLanguage?: string;
    },
  ) {
    return prepare(args);
  },

  /**
   * Prépare le contexte d'une réponse IA.
   */
  prepareReply(
    prepare: (args: {
      conversationId: Id<"conversations">;
      limit?: number;
      messageId?: Id<"messages">;
    }) => unknown,
    args: {
      conversationId: Id<"conversations">;
      limit?: number;
      messageId?: Id<"messages">;
    },
  ) {
    return prepare(args);
  },

  /**
   * Prépare le contexte nécessaire au résumé.
   */
  prepareSummary(
    prepare: (args: {
      conversationId: Id<"conversations">;
      limit?: number;
    }) => unknown,
    args: {
      conversationId: Id<"conversations">;
      limit?: number;
    },
  ) {
    return prepare(args);
  },

  /**
   * Prépare une traduction.
   */
  prepareTranslation(
    prepare: (args: {
      messageId: Id<"messages">;
      targetLanguage: string;
    }) => unknown,
    args: {
      messageId: Id<"messages">;
      targetLanguage: string;
    },
  ) {
    return prepare(args);
  },

  /**
   * Prépare une réécriture.
   */
  prepareRewrite(
    prepare: (args: { messageId: Id<"messages">; style?: string }) => unknown,
    args: {
      messageId: Id<"messages">;
      style?: string;
    },
  ) {
    return prepare(args);
  },
};

export default aiService;
