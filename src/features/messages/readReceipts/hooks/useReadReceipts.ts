import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { readReceiptsService } from "../services/readReceipts.service";

interface UseReadReceiptsOptions {
  conversationId?: Id<"conversations">;
}

export function useReadReceipts(options: UseReadReceiptsOptions = {}) {
  const { conversationId } = options;
  const { isAuthenticated } = useConvexAuth();

  const markAsReadMutation = useMutation(api.messages.readReceipts.markAsRead);

  const markManyAsReadMutation = useMutation(
    api.messages.readReceipts.markManyAsRead,
  );

  const conversationReceipts = useQuery(
    api.messages.readReceipts.getConversationReadReceipts,
    isAuthenticated && conversationId ? { conversationId } : "skip",
  );

  const pendingMessageIdsRef = useRef<Set<Id<"messages">>>(new Set());

  const markAsRead = useCallback(
    async (messageId: Id<"messages">) => {
      if (!isAuthenticated) {
        return null;
      }

      try {
        const receiptId = await readReceiptsService.markAsRead(
          markAsReadMutation,
          messageId,
        );

        pendingMessageIdsRef.current.delete(messageId);

        return receiptId;
      } catch (error) {
        console.error(
          "[useReadReceipts] Impossible de marquer le message comme lu:",
          error,
        );

        throw error;
      }
    },
    [isAuthenticated, markAsReadMutation],
  );

  const markManyAsRead = useCallback(
    async (messageIds: Id<"messages">[]) => {
      if (!isAuthenticated || messageIds.length === 0) {
        return [];
      }

      const uniqueIds = [...new Set(messageIds)];

      try {
        const receiptIds = await readReceiptsService.markManyAsRead(
          markManyAsReadMutation,
          uniqueIds,
        );

        for (const messageId of uniqueIds) {
          pendingMessageIdsRef.current.delete(messageId);
        }

        return receiptIds;
      } catch (error) {
        console.error(
          "[useReadReceipts] Impossible de marquer les messages comme lus:",
          error,
        );

        throw error;
      }
    },
    [isAuthenticated, markManyAsReadMutation],
  );

  const queueAsRead = useCallback((messageId: Id<"messages">) => {
    pendingMessageIdsRef.current.add(messageId);
  }, []);

  const flushPending = useCallback(async () => {
    const messageIds = Array.from(pendingMessageIdsRef.current);

    if (messageIds.length === 0) {
      return [];
    }

    return markManyAsRead(messageIds);
  }, [markManyAsRead]);

  const getReceiptForMessage = useCallback(
    (messageId: Id<"messages">) => {
      const entry = conversationReceipts?.find(
        (item) => item.messageId === messageId,
      );

      if (!entry) {
        return [];
      }

      return entry.receipts;
    },
    [conversationReceipts],
  );

  const isMessageReadBy = useCallback(
    (messageId: Id<"messages">, userId: Id<"users">) => {
      const receipts = getReceiptForMessage(messageId);

      return receipts.some((receipt) => receipt.userId === userId);
    },
    [getReceiptForMessage],
  );

  const getLastReadAt = useCallback(
    (messageId: Id<"messages">) => {
      const receipts = getReceiptForMessage(messageId);

      if (receipts.length === 0) {
        return null;
      }

      return receipts.reduce<string | null>((latest, receipt) => {
        if (!latest) {
          return receipt.readAt;
        }

        return receipt.readAt > latest ? receipt.readAt : latest;
      }, null);
    },
    [getReceiptForMessage],
  );

  useEffect(() => {
    return () => {
      pendingMessageIdsRef.current.clear();
    };
  }, []);

  return {
    receipts: conversationReceipts ?? [],

    isLoading:
      isAuthenticated &&
      Boolean(conversationId) &&
      conversationReceipts === undefined,

    markAsRead,
    markManyAsRead,
    queueAsRead,
    flushPending,
    getReceiptForMessage,
    isMessageReadBy,
    getLastReadAt,
  };
}

export default useReadReceipts;
