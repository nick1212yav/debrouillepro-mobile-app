// src/features/messages/stores/chat.store.ts

import { useCallback, useMemo, useState } from "react";
import type { ConversationId, MessageId } from "../types";

export interface ChatStoreState {
  conversationId: ConversationId | null;
  replyingToId: MessageId | null;
  selectedMessageId: MessageId | null;
  isSearchOpen: boolean;
  isAttachmentPickerOpen: boolean;
  isEmojiPickerOpen: boolean;
  isContextMenuOpen: boolean;
}

export interface ChatStoreActions {
  setConversation: (conversationId: ConversationId | null) => void;

  setReplyingTo: (messageId: MessageId | null) => void;

  selectMessage: (messageId: MessageId | null) => void;

  setSearchOpen: (open: boolean) => void;

  setAttachmentPickerOpen: (open: boolean) => void;

  setEmojiPickerOpen: (open: boolean) => void;

  setContextMenuOpen: (open: boolean) => void;

  reset: () => void;
}

export interface ChatStore extends ChatStoreState {
  actions: ChatStoreActions;
}

const INITIAL_STATE: ChatStoreState = {
  conversationId: null,
  replyingToId: null,
  selectedMessageId: null,
  isSearchOpen: false,
  isAttachmentPickerOpen: false,
  isEmojiPickerOpen: false,
  isContextMenuOpen: false,
};

export function useChatStore(): ChatStore {
  const [conversationId, setConversation] = useState<ConversationId | null>(
    INITIAL_STATE.conversationId,
  );

  const [replyingToId, setReplyingTo] = useState<MessageId | null>(
    INITIAL_STATE.replyingToId,
  );

  const [selectedMessageId, selectMessage] = useState<MessageId | null>(
    INITIAL_STATE.selectedMessageId,
  );

  const [isSearchOpen, setSearchOpen] = useState(INITIAL_STATE.isSearchOpen);

  const [isAttachmentPickerOpen, setAttachmentPickerOpen] = useState(
    INITIAL_STATE.isAttachmentPickerOpen,
  );

  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(
    INITIAL_STATE.isEmojiPickerOpen,
  );

  const [isContextMenuOpen, setContextMenuOpen] = useState(
    INITIAL_STATE.isContextMenuOpen,
  );

  const reset = useCallback(() => {
    setConversation(null);
    setReplyingTo(null);
    selectMessage(null);
    setSearchOpen(false);
    setAttachmentPickerOpen(false);
    setEmojiPickerOpen(false);
    setContextMenuOpen(false);
  }, []);

  const actions = useMemo<ChatStoreActions>(
    () => ({
      setConversation,
      setReplyingTo,
      selectMessage,
      setSearchOpen,
      setAttachmentPickerOpen,
      setEmojiPickerOpen,
      setContextMenuOpen,
      reset,
    }),
    [reset],
  );

  return {
    conversationId,
    replyingToId,
    selectedMessageId,
    isSearchOpen,
    isAttachmentPickerOpen,
    isEmojiPickerOpen,
    isContextMenuOpen,
    actions,
  };
}

export default useChatStore;
