import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { AIAction } from "../services/ai.service";

interface UseMessageAIOptions {
  conversationId?: Id<"conversations">;
  messageId?: Id<"messages">;
  targetLanguage?: string;
  replyLimit?: number;
  summaryLimit?: number;
}

export function useMessageAI({
  conversationId,
  messageId,
  targetLanguage,
  replyLimit = 20,
  summaryLimit = 50,
}: UseMessageAIOptions = {}) {
  /**
   * --------------------------------------------------------------------------
   * BACKEND — CONTEXTES
   * --------------------------------------------------------------------------
   */

  const conversationContext = useQuery(
    api.messages.ai.getConversationAIContext,
    conversationId
      ? {
          conversationId,
          limit: 30,
        }
      : "skip",
  );

  const messageContext = useQuery(
    api.messages.ai.getMessageAIContext,
    messageId
      ? {
          messageId,
        }
      : "skip",
  );

  const replyContext = useQuery(
    api.messages.ai.prepareAIReply,
    conversationId
      ? {
          conversationId,
          limit: replyLimit,
          messageId,
        }
      : "skip",
  );

  const summaryContext = useQuery(
    api.messages.ai.prepareConversationSummary,
    conversationId
      ? {
          conversationId,
          limit: summaryLimit,
        }
      : "skip",
  );

  const translationContext = useQuery(
    api.messages.ai.prepareTranslation,
    messageId && targetLanguage?.trim()
      ? {
          messageId,
          targetLanguage: targetLanguage.trim(),
        }
      : "skip",
  );

  const rewriteContext = useQuery(
    api.messages.ai.prepareRewrite,
    messageId
      ? {
          messageId,
          style: "natural",
        }
      : "skip",
  );

  const conversationStats = useQuery(
    api.messages.ai.getAIConversationStats,
    conversationId
      ? {
          conversationId,
        }
      : "skip",
  );

  /**
   * --------------------------------------------------------------------------
   * BACKEND — ACTION MESSAGE
   * --------------------------------------------------------------------------
   */

  const prepareMessageAI = useMutation(api.messages.ai.prepareMessageAI);

  const prepareAction = useCallback(
    async (
      action: AIAction,
      options?: {
        targetLanguage?: string;
      },
    ) => {
      if (!messageId) {
        throw new Error("Aucun message sélectionné.");
      }

      if (action === "translate" && !options?.targetLanguage?.trim()) {
        throw new Error("La langue cible est requise.");
      }

      return prepareMessageAI({
        messageId,
        action,
        targetLanguage: options?.targetLanguage?.trim() || undefined,
      });
    },
    [messageId, prepareMessageAI],
  );

  /**
   * Actions pratiques.
   */

  const summarize = useCallback(
    () => prepareAction("summarize"),
    [prepareAction],
  );

  const translate = useCallback(
    (language: string) =>
      prepareAction("translate", {
        targetLanguage: language,
      }),
    [prepareAction],
  );

  const rewrite = useCallback(() => prepareAction("rewrite"), [prepareAction]);

  const improve = useCallback(() => prepareAction("improve"), [prepareAction]);

  const shorten = useCallback(() => prepareAction("shorten"), [prepareAction]);

  const expand = useCallback(() => prepareAction("expand"), [prepareAction]);

  const reply = useCallback(() => prepareAction("reply"), [prepareAction]);

  return {
    /**
     * Contextes backend.
     */
    conversationContext,
    messageContext,
    replyContext,
    summaryContext,
    translationContext,
    rewriteContext,
    conversationStats,

    /**
     * État.
     */
    isLoadingConversationContext:
      conversationId !== undefined && conversationContext === undefined,

    isLoadingMessageContext:
      messageId !== undefined && messageContext === undefined,

    isLoadingReplyContext:
      conversationId !== undefined && replyContext === undefined,

    isLoadingSummary:
      conversationId !== undefined && summaryContext === undefined,

    isLoadingTranslation:
      messageId !== undefined &&
      !!targetLanguage &&
      translationContext === undefined,

    isLoadingRewrite: messageId !== undefined && rewriteContext === undefined,

    /**
     * Actions.
     */
    prepareAction,
    summarize,
    translate,
    rewrite,
    improve,
    shorten,
    expand,
    reply,
  };
}

export default useMessageAI;
