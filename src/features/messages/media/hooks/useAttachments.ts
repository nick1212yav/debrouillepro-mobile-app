// src/features/messages/media/hooks/useAttachments.ts

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

      /*
       * Appel direct de la mutation Convex.
       *
       * On évite `mediaService.addAttachment` ici car son type
       * intermédiaire (AddAttachmentMutation) est désynchronisé
       * avec la signature backend qui exige désormais
       * fileId: Id<"_storage">.
       *
       * Le storageId provient toujours de `uploadUri()` côté
       * composer, qui l'obtient de Convex Storage. Le cast est
       * donc légitime : c'est un ID Convex Storage réel.
       */
      return addAttachmentMutation({
        messageId,
        fileId: args.fileId as Id<"_storage">,
        fileName: args.fileName,
        mimeType: args.mimeType,
        fileSize: args.fileSize,
        width: args.width,
        height: args.height,
        duration: args.duration,
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
