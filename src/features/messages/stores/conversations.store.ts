// src/features/messages/stores/conversations.store.ts

import { useCallback, useMemo, useState } from "react";
import type { Conversation, ConversationId } from "../types";

export interface ConversationsStoreState {
  conversations: Conversation[];
  selectedConversationId: ConversationId | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

export interface ConversationsStoreActions {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (
    conversationId: ConversationId,
    updates: Partial<Conversation>,
  ) => void;
  removeConversation: (conversationId: ConversationId) => void;
  selectConversation: (conversationId: ConversationId | null) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export interface ConversationsStore extends ConversationsStoreState {
  actions: ConversationsStoreActions;
}

const INITIAL_STATE: ConversationsStoreState = {
  conversations: [],
  selectedConversationId: null,
  searchQuery: "",
  isLoading: false,
  error: null,
};

export function useConversationsStore(): ConversationsStore {
  const [conversations, setConversationsState] = useState<Conversation[]>(
    INITIAL_STATE.conversations,
  );

  const [selectedConversationId, setSelectedConversationId] =
    useState<ConversationId | null>(INITIAL_STATE.selectedConversationId);

  const [searchQuery, setSearchQueryState] = useState(
    INITIAL_STATE.searchQuery,
  );

  const [isLoading, setLoading] = useState(INITIAL_STATE.isLoading);

  const [error, setError] = useState<string | null>(INITIAL_STATE.error);

  const setConversations = useCallback((nextConversations: Conversation[]) => {
    setConversationsState(nextConversations);
    setError(null);
  }, []);

  const addConversation = useCallback((conversation: Conversation) => {
    setConversationsState((current) => {
      const exists = current.some((item) => item._id === conversation._id);

      if (exists) {
        return current;
      }

      return [conversation, ...current];
    });
  }, []);

  const updateConversation = useCallback(
    (conversationId: ConversationId, updates: Partial<Conversation>) => {
      setConversationsState((current) =>
        current.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, ...updates }
            : conversation,
        ),
      );
    },
    [],
  );

  const removeConversation = useCallback((conversationId: ConversationId) => {
    setConversationsState((current) =>
      current.filter((conversation) => conversation._id !== conversationId),
    );

    setSelectedConversationId((current) =>
      current === conversationId ? null : current,
    );
  }, []);

  const selectConversation = useCallback(
    (conversationId: ConversationId | null) => {
      setSelectedConversationId(conversationId);
    },
    [],
  );

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const clear = useCallback(() => {
    setConversationsState([]);
    setSelectedConversationId(null);
    setSearchQueryState("");
    setLoading(false);
    setError(null);
  }, []);

  const actions = useMemo<ConversationsStoreActions>(
    () => ({
      setConversations,
      addConversation,
      updateConversation,
      removeConversation,
      selectConversation,
      setSearchQuery,
      setLoading,
      setError,
      clear,
    }),
    [
      setConversations,
      addConversation,
      updateConversation,
      removeConversation,
      selectConversation,
      setSearchQuery,
      clear,
    ],
  );

  return {
    conversations,
    selectedConversationId,
    searchQuery,
    isLoading,
    error,
    actions,
  };
}

export default useConversationsStore;
