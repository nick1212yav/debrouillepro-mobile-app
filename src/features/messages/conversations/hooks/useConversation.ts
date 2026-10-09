import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import conversationsService from "../services/conversations.service";

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

  const preview = conversation
    ? conversationsService.toPreview(conversation, currentUserId)
    : null;

  const unreadCount =
    conversation?.members?.find((member) => member.userId === currentUserId)
      ?.unreadCount ?? 0;

  const title = conversation
    ? conversationsService.getTitle(conversation, currentUserId)
    : "Conversation";

  const avatar = conversation
    ? conversationsService.getAvatar(conversation, currentUserId)
    : null;

  return {
    conversation,
    preview,
    unreadCount,
    title,
    avatar,
    isLoading: conversation === undefined,
  };
}

export default useConversation;
