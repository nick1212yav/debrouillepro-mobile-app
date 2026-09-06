// src/features/messages/offline/hooks/useOfflineMessages.ts

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  CreateOfflineMessageInput,
  OfflineMessage,
} from "../types/offline.types";

import {
  clearConversationOfflineMessages,
  clearOfflineMessages,
  getConversationOfflineMessages,
  getOfflineMessages,
  getPendingOfflineMessages,
  isOfflineStorageAvailable,
  markOfflineMessageFailed,
  markOfflineMessageSending,
  markOfflineMessageSent,
  removeOfflineMessage,
  saveOfflineMessage,
  updateOfflineMessage,
} from "../services/offline.service";

export interface UseOfflineMessagesOptions {
  conversationId?: string;
}

export interface UseOfflineMessagesResult {
  messages: OfflineMessage[];
  pendingMessages: OfflineMessage[];

  isStorageAvailable: boolean;

  save: (input: CreateOfflineMessageInput) => OfflineMessage;

  update: (
    messageId: string,
    patch: Partial<OfflineMessage>,
  ) => OfflineMessage | null;

  markSending: (messageId: string) => OfflineMessage | null;

  markSent: (messageId: string) => OfflineMessage | null;

  markFailed: (messageId: string, error?: string) => OfflineMessage | null;

  remove: (messageId: string) => boolean;

  clear: () => void;

  refresh: () => void;
}

export function useOfflineMessages(
  options: UseOfflineMessagesOptions = {},
): UseOfflineMessagesResult {
  const { conversationId } = options;

  const [messages, setMessages] = useState<OfflineMessage[]>([]);

  const [isStorageAvailable, setIsStorageAvailable] = useState(
    isOfflineStorageAvailable(),
  );

  const refresh = useCallback(() => {
    setIsStorageAvailable(isOfflineStorageAvailable());

    const nextMessages = conversationId
      ? getConversationOfflineMessages(conversationId)
      : getOfflineMessages();

    setMessages(nextMessages);
  }, [conversationId]);

  useEffect(() => {
    refresh();

    const handleStorage = () => {
      refresh();
    };

    if (typeof undefined !== "undefined") {
      undefined;
    }

    return () => {
      if (typeof undefined !== "undefined") {
        undefined;
      }
    };
  }, [refresh]);

  const pendingMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.status === "pending" || message.status === "failed",
      ),
    [messages],
  );

  const save = useCallback(
    (input: CreateOfflineMessageInput) => {
      const message = saveOfflineMessage(input);

      refresh();

      return message;
    },
    [refresh],
  );

  const update = useCallback(
    (messageId: string, patch: Partial<OfflineMessage>) => {
      const message = updateOfflineMessage(messageId, patch);

      refresh();

      return message;
    },
    [refresh],
  );

  const markSending = useCallback(
    (messageId: string) => {
      const message = markOfflineMessageSending(messageId);

      refresh();

      return message;
    },
    [refresh],
  );

  const markSent = useCallback(
    (messageId: string) => {
      const message = markOfflineMessageSent(messageId);

      refresh();

      return message;
    },
    [refresh],
  );

  const markFailed = useCallback(
    (messageId: string, error?: string) => {
      const message = markOfflineMessageFailed(messageId, error);

      refresh();

      return message;
    },
    [refresh],
  );

  const remove = useCallback(
    (messageId: string) => {
      const result = removeOfflineMessage(messageId);

      refresh();

      return result;
    },
    [refresh],
  );

  const clear = useCallback(() => {
    if (conversationId) {
      clearConversationOfflineMessages(conversationId);
    } else {
      clearOfflineMessages();
    }

    refresh();
  }, [conversationId, refresh]);

  return {
    messages,
    pendingMessages,
    isStorageAvailable,
    save,
    update,
    markSending,
    markSent,
    markFailed,
    remove,
    clear,
    refresh,
  };
}

export default useOfflineMessages;
