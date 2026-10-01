import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import conversationsService, {
  type Conversation,
} from "../services/conversations.service";

export function useConversations(currentUserId?: Id<"users"> | null) {
  const skip = !currentUserId;

  const conversations = useQuery(
    api.messages.conversations.list,
    skip ? "skip" : {},
  );

  const unreadCount = useQuery(
    api.messages.conversations.getUnreadCount,
    skip ? "skip" : {},
  );

  const normalized: Conversation[] = conversations
    ? conversationsService.sort(conversations as Conversation[])
    : [];

  const previews = normalized.map((conversation) =>
    conversationsService.toPreview(conversation, currentUserId),
  );

  return {
    conversations: normalized,
    previews,
    unreadCount: unreadCount ?? 0,
    isLoading:
      !skip && (conversations === undefined || unreadCount === undefined),
  };
}

export default useConversations;
