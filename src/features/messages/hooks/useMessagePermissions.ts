// src/features/messages/hooks/useMessagePermissions.ts

import { useMemo } from "react";
import type {
  ConversationMember,
  Message,
  MessagePermissions,
  UserId,
} from "../types";

export interface UseMessagePermissionsOptions {
  message?: Message | null;
  currentUserId?: UserId | null;
  member?: ConversationMember | null;
}

function isMessageOwner(
  message: Message | null | undefined,
  currentUserId: UserId | null | undefined,
): boolean {
  if (!message || !currentUserId) {
    return false;
  }

  return message.senderId === currentUserId;
}

function isAdminOrOwner(
  member: ConversationMember | null | undefined,
): boolean {
  return member?.role === "owner" || member?.role === "admin";
}

export function useMessagePermissions(
  options: UseMessagePermissionsOptions = {},
): MessagePermissions {
  const { message = null, currentUserId = null, member = null } = options;

  return useMemo<MessagePermissions>(() => {
    const isOwner = isMessageOwner(message, currentUserId);

    const isModerator = isAdminOrOwner(member);

    const canSend = Boolean(member);

    const canEdit = isOwner && !message?.isDeleted;

    const canDelete = isOwner || (isModerator && Boolean(message));

    const canReply = Boolean(member && message && !message.isDeleted);

    const canForward = Boolean(member && message && !message.isDeleted);

    const canReact = Boolean(member && message && !message.isDeleted);

    const canPin = Boolean(
      member && message && !message.isDeleted && (isOwner || isModerator),
    );

    return {
      canSend,
      canEdit,
      canDelete,
      canReply,
      canForward,
      canReact,
      canPin,
    };
  }, [message, currentUserId, member]);
}

export default useMessagePermissions;
