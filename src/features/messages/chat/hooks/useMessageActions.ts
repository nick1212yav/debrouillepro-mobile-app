import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { SendMessageInput } from "../services/chat.service";

export function useMessageActions() {
  const send = useMutation(api.messages.messages.send);

  const sendToUser = useMutation(api.messages.messages.sendToUser);

  const markAsRead = useMutation(api.messages.messages.markAsRead);

  const markConversationAsRead = useMutation(
    api.messages.messages.markConversationAsRead,
  );

  const markAsDelivered = useMutation(api.messages.messages.markAsDelivered);

  const sendMessage = async (input: SendMessageInput) => {
    return send({
      conversationId: input.conversationId,
      text: input.text,
      ...(input.replyToId
        ? {
            replyToId: input.replyToId,
          }
        : {}),
      ...(input.sharedPublicationId
        ? {
            sharedPublicationId: input.sharedPublicationId,
          }
        : {}),
    });
  };

  const sendMessageToUser = async ({
    userId,
    text,
    replyToId,
    sharedPublicationId,
  }: {
    userId: Id<"users">;
    text: string;
    replyToId?: Id<"messages">;
    sharedPublicationId?: Id<"publications">;
  }) => {
    return sendToUser({
      userId,
      text,
      ...(replyToId
        ? {
            replyToId,
          }
        : {}),
      ...(sharedPublicationId
        ? {
            sharedPublicationId,
          }
        : {}),
    });
  };

  const markMessageAsRead = async (messageId: Id<"messages">) => {
    return markAsRead({
      messageId,
    });
  };

  const markAllAsRead = async (conversationId: Id<"conversations">) => {
    return markConversationAsRead({
      conversationId,
    });
  };

  const markMessageAsDelivered = async (messageId: Id<"messages">) => {
    return markAsDelivered({
      messageId,
    });
  };

  return {
    sendMessage,
    sendMessageToUser,
    markMessageAsRead,
    markAllAsRead,
    markMessageAsDelivered,
  };
}

export default useMessageActions;
