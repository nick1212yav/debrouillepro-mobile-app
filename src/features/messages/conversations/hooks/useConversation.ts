import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import conversationsService, {
  type Conversation,
} from "../services/conversations.service";

export function useConversation(
  conversationId: Id<"conversations"> | null | undefined,

  currentUserId?: Id<"users"> | null,
) {
  const conversation = useQuery(
    api.messages.conversations.get,
    conversationId
      ? {
          conversationId,
        }
      : "skip",
  );

  const unreadCount = useQuery(
    api.messages.conversations.getUnreadCountForConversation,
    conversationId
      ? {
          conversationId,
        }
      : "skip",
  );

  const normalizedConversation = conversation
    ? (conversation as Conversation)
    : null;

  const preview = normalizedConversation
    ? conversationsService.toPreview(normalizedConversation, currentUserId)
    : null;

  return {
    conversation: normalizedConversation,

    preview,

    unreadCount: unreadCount ?? 0,

    title: normalizedConversation
      ? conversationsService.getTitle(normalizedConversation, currentUserId)
      : "Conversation",

    avatar: normalizedConversation
      ? conversationsService.getAvatar(normalizedConversation, currentUserId)
      : null,

    isLoading: conversation === undefined || unreadCount === undefined,
  };
}

export default useConversation;
