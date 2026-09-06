// src/features/messages/stores/messages.store.ts

import { useCallback, useMemo, useState } from "react";
import type { ConversationId, Message, MessageId } from "../types";

export interface MessagesStoreState {
  messages: Message[];
  activeConversationId: ConversationId | null;
  selectedMessageId: MessageId | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
}

export interface MessagesStoreActions {
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: MessageId, updates: Partial<Message>) => void;
  removeMessage: (messageId: MessageId) => void;
  setActiveConversation: (conversationId: ConversationId | null) => void;
  selectMessage: (messageId: MessageId | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export interface MessagesStore extends MessagesStoreState {
  actions: MessagesStoreActions;
}

const INITIAL_STATE: MessagesStoreState = {
  messages: [],
  activeConversationId: null,
  selectedMessageId: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
};

export function useMessagesStore(): MessagesStore {
  const [messages, setMessages] = useState<Message[]>(INITIAL_STATE.messages);

  const [activeConversationId, setActiveConversation] =
    useState<ConversationId | null>(INITIAL_STATE.activeConversationId);

  const [selectedMessageId, setSelectedMessage] = useState<MessageId | null>(
    INITIAL_STATE.selectedMessageId,
  );

  const [isLoading, setLoading] = useState(INITIAL_STATE.isLoading);

  const [isLoadingMore, setLoadingMore] = useState(INITIAL_STATE.isLoadingMore);

  const [hasMore, setHasMore] = useState(INITIAL_STATE.hasMore);

  const [error, setError] = useState<string | null>(INITIAL_STATE.error);

  const replaceMessages = useCallback((nextMessages: Message[]) => {
    setMessages(nextMessages);
    setError(null);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages((current) => {
      const exists = current.some((item) => item._id === message._id);

      if (exists) {
        return current;
      }

      return [...current, message];
    });
  }, []);

  const updateMessage = useCallback(
    (messageId: MessageId, updates: Partial<Message>) => {
      setMessages((current) =>
        current.map((message) =>
          message._id === messageId ? { ...message, ...updates } : message,
        ),
      );
    },
    [],
  );

  const removeMessage = useCallback((messageId: MessageId) => {
    setMessages((current) =>
      current.filter((message) => message._id !== messageId),
    );

    setSelectedMessage((current) => (current === messageId ? null : current));
  }, []);

  const selectMessage = useCallback((messageId: MessageId | null) => {
    setSelectedMessage(messageId);
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setActiveConversation(null);
    setSelectedMessage(null);
    setLoading(false);
    setLoadingMore(false);
    setHasMore(true);
    setError(null);
  }, []);

  const actions = useMemo<MessagesStoreActions>(
    () => ({
      setMessages: replaceMessages,
      addMessage,
      updateMessage,
      removeMessage,
      setActiveConversation,
      selectMessage,
      setLoading,
      setLoadingMore,
      setHasMore,
      setError,
      clear,
    }),
    [
      replaceMessages,
      addMessage,
      updateMessage,
      removeMessage,
      setActiveConversation,
      selectMessage,
      clear,
    ],
  );

  return {
    messages,
    activeConversationId,
    selectedMessageId,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    actions,
  };
}

export default useMessagesStore;
