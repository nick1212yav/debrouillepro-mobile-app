// src/features/messages/voice/services/voice.service.ts

import type { Id } from "@/convex/_generated/dataModel";

export interface SendVoiceMessageArgs {
  conversationId: Id<"conversations">;
  fileId: Id<"_storage">;
  duration: number;
}

export interface VoiceMessageData {
  messageId: Id<"messages">;
  fileId: Id<"_storage"> | undefined;
  duration: number | undefined;
}

type SendVoiceMutation = (
  args: SendVoiceMessageArgs,
) => Promise<Id<"messages">>;

type GetVoiceQuery = (args: {
  messageId: Id<"messages">;
}) => Promise<VoiceMessageData | null>;

export const voiceService = {
  async sendVoiceMessage(
    mutation: SendVoiceMutation,
    args: SendVoiceMessageArgs,
  ): Promise<Id<"messages">> {
    if (!Number.isFinite(args.duration) || args.duration < 0) {
      throw new Error("La durée du message vocal est invalide.");
    }

    return mutation({
      conversationId: args.conversationId,
      fileId: args.fileId,
      duration: args.duration,
    });
  },

  async getVoiceMessage(
    query: GetVoiceQuery,
    messageId: Id<"messages">,
  ): Promise<VoiceMessageData | null> {
    return query({
      messageId,
    });
  },
};

export default voiceService;
