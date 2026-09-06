import { useEffect } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import { useConversation } from "@/features/messages/conversations/hooks/useConversation";

import { useMessages } from "./useMessages";

import { useMessageActions } from "./useMessageActions";

export function useChat(
  conversationId: Id<"conversations"> | null | undefined,

  currentUserId?: Id<"users"> | null,
) {
  const conversation = useConversation(conversationId, currentUserId);

  const messages = useMessages(conversationId);

  const { markAllAsRead, markMessageAsDelivered } = useMessageActions();

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    void markAllAsRead(conversationId);
  }, [conversationId, markAllAsRead]);

  useEffect(() => {
    if (!conversationId || !currentUserId || messages.messages.length === 0) {
      return;
    }

    const unreadMessages = messages.messages.filter(
      (message) =>
        message.senderId !== currentUserId &&
        message.status !== "delivered" &&
        message.status !== "read",
    );

    for (const message of unreadMessages) {
      void markMessageAsDelivered(message._id);
    }
  }, [
    conversationId,
    currentUserId,
    messages.messages,
    markMessageAsDelivered,
  ]);

  return {
    conversation: conversation.conversation,

    conversationPreview: conversation.preview,

    title: conversation.title,

    avatar: conversation.avatar,

    unreadCount: conversation.unreadCount,

    messages: messages.messages,

    messagesStatus: messages.status,

    loadMoreMessages: messages.loadMore,

    isLoading: conversation.isLoading || messages.isLoadingFirstPage,

    isLoadingMore: messages.isLoadingMore,

    isDone: messages.isDone,

    markAllAsRead: () =>
      conversationId ? markAllAsRead(conversationId) : Promise.resolve(null),
  };
}

export default useChat;
