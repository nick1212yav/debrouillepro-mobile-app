import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import conversationsService, {
  type Conversation,
} from "../services/conversations.service";

export function useConversations(currentUserId?: Id<"users"> | null) {
  const conversations = useQuery(api.messages.conversations.list);

  const unreadCount = useQuery(api.messages.conversations.getUnreadCount);

  const normalized = conversations
    ? conversationsService.sort(conversations as Conversation[])
    : [];

  const previews = normalized.map((conversation) =>
    conversationsService.toPreview(conversation, currentUserId),
  );

  return {
    conversations: normalized,

    previews,

    unreadCount: unreadCount ?? 0,

    isLoading: conversations === undefined || unreadCount === undefined,
  };
}

export default useConversations;
