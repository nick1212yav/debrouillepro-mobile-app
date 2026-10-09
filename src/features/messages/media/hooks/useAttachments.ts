import { useCallback } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import mediaService, {
  type AddAttachmentArgs,
} from "../services/media.service";

export function useAttachments(messageId: Id<"messages"> | null | undefined) {
  const attachments = useQuery(
    api.messages.attachments.getAttachments,
    messageId
      ? {
          messageId,
        }
      : "skip",
  );

  const addAttachmentMutation = useMutation(
    api.messages.attachments.addAttachment,
  );

  const deleteAttachmentMutation = useMutation(
    api.messages.attachments.deleteAttachment,
  );

  const addAttachment = useCallback(
    async (args: Omit<AddAttachmentArgs, "messageId">) => {
      if (!messageId) {
        throw new Error("Message introuvable.");
      }

      return mediaService.addAttachment(addAttachmentMutation, {
        ...args,
        messageId,
      });
    },
    [addAttachmentMutation, messageId],
  );

  const deleteAttachment = useCallback(
    async (attachmentId: Id<"attachments">) => {
      return mediaService.deleteAttachment(
        deleteAttachmentMutation,
        attachmentId,
      );
    },
    [deleteAttachmentMutation],
  );

  return {
    attachments: attachments ?? [],
    isLoading: attachments === undefined,
    addAttachment,
    deleteAttachment,
  };
}

export default useAttachments;
