import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useConversationActions() {
  const getOrCreateDirect = useMutation(
    api.messages.conversations.getOrCreateDirect,
  );

  const createGroup = useMutation(api.messages.conversations.createGroup);

  const updateGroup = useMutation(api.messages.conversations.updateGroup);

  const updateLastMessage = useMutation(
    api.messages.conversations.updateLastMessage,
  );

  const markAsRead = useMutation(api.messages.conversations.markAsRead);

  const leave = useMutation(api.messages.conversations.leave);

  const openDirectConversation = async (otherUserId: Id<"users">) => {
    return getOrCreateDirect({
      otherUserId,
    });
  };

  const createGroupConversation = async ({
    participantIds,
    groupName,
    groupAvatar,
  }: {
    participantIds: Id<"users">[];
    groupName: string;
    groupAvatar?: string;
  }) => {
    return createGroup({
      participantIds,
      groupName,
      ...(groupAvatar !== undefined
        ? {
            groupAvatar,
          }
        : {}),
    });
  };

  const editGroup = async ({
    conversationId,
    groupName,
    groupAvatar,
  }: {
    conversationId: Id<"conversations">;
    groupName?: string;
    groupAvatar?: string;
  }) => {
    return updateGroup({
      conversationId,
      ...(groupName !== undefined
        ? {
            groupName,
          }
        : {}),
      ...(groupAvatar !== undefined
        ? {
            groupAvatar,
          }
        : {}),
    });
  };

  const updateConversationPreview = async ({
    conversationId,
    lastMessageText,
    lastMessageSenderId,
  }: {
    conversationId: Id<"conversations">;
    lastMessageText?: string;
    lastMessageSenderId?: Id<"users">;
  }) => {
    return updateLastMessage({
      conversationId,
      ...(lastMessageText !== undefined
        ? {
            lastMessageText,
          }
        : {}),
      ...(lastMessageSenderId !== undefined
        ? {
            lastMessageSenderId,
          }
        : {}),
    });
  };

  const markConversationAsRead = async (
    conversationId: Id<"conversations">,
  ) => {
    return markAsRead({
      conversationId,
    });
  };

  const leaveConversation = async (conversationId: Id<"conversations">) => {
    return leave({
      conversationId,
    });
  };

  return {
    openDirectConversation,
    createGroupConversation,
    editGroup,
    updateConversationPreview,
    markConversationAsRead,
    leaveConversation,
  };
}

export default useConversationActions;
