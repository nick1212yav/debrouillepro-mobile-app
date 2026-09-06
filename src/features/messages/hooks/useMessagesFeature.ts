// src/features/messages/hooks/useMessagesFeature.ts

import { useCallback, useMemo, useState } from "react";
import type { ConversationId, MessageId } from "../types";

export interface MessagesFeatureState {
  activeConversationId: ConversationId | null;
  selectedMessageId: MessageId | null;
  isChatOpen: boolean;
  isConversationListOpen: boolean;
  isSearchOpen: boolean;
}

export interface MessagesFeatureActions {
  openConversation: (conversationId: ConversationId) => void;
  closeConversation: () => void;
  selectMessage: (messageId: MessageId | null) => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleConversationList: () => void;
  reset: () => void;
}

export interface UseMessagesFeatureResult extends MessagesFeatureState {
  actions: MessagesFeatureActions;
}

const INITIAL_STATE: MessagesFeatureState = {
  activeConversationId: null,
  selectedMessageId: null,
  isChatOpen: false,
  isConversationListOpen: true,
  isSearchOpen: false,
};

export function useMessagesFeature(): UseMessagesFeatureResult {
  const [activeConversationId, setActiveConversationId] =
    useState<ConversationId | null>(INITIAL_STATE.activeConversationId);

  const [selectedMessageId, setSelectedMessageId] = useState<MessageId | null>(
    INITIAL_STATE.selectedMessageId,
  );

  const [isChatOpen, setIsChatOpen] = useState(INITIAL_STATE.isChatOpen);

  const [isConversationListOpen, setIsConversationListOpen] = useState(
    INITIAL_STATE.isConversationListOpen,
  );

  const [isSearchOpen, setIsSearchOpen] = useState(INITIAL_STATE.isSearchOpen);

  const openConversation = useCallback((conversationId: ConversationId) => {
    setActiveConversationId(conversationId);
    setSelectedMessageId(null);
    setIsChatOpen(true);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversationId(null);
    setSelectedMessageId(null);
    setIsChatOpen(false);
  }, []);

  const selectMessage = useCallback((messageId: MessageId | null) => {
    setSelectedMessageId(messageId);
  }, []);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const toggleConversationList = useCallback(() => {
    setIsConversationListOpen((current) => !current);
  }, []);

  const reset = useCallback(() => {
    setActiveConversationId(INITIAL_STATE.activeConversationId);
    setSelectedMessageId(INITIAL_STATE.selectedMessageId);
    setIsChatOpen(INITIAL_STATE.isChatOpen);
    setIsConversationListOpen(INITIAL_STATE.isConversationListOpen);
    setIsSearchOpen(INITIAL_STATE.isSearchOpen);
  }, []);

  const actions = useMemo<MessagesFeatureActions>(
    () => ({
      openConversation,
      closeConversation,
      selectMessage,
      openSearch,
      closeSearch,
      toggleConversationList,
      reset,
    }),
    [
      openConversation,
      closeConversation,
      selectMessage,
      openSearch,
      closeSearch,
      toggleConversationList,
      reset,
    ],
  );

  return {
    activeConversationId,
    selectedMessageId,
    isChatOpen,
    isConversationListOpen,
    isSearchOpen,
    actions,
  };
}

export default useMessagesFeature;
