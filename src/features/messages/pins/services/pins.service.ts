// src/features/messages/pins/services/pins.service.ts

import type { Id } from "@/convex/_generated/dataModel";

type TogglePinMutation = (args: {
  messageId: Id<"messages">;
}) => Promise<boolean>;

export const pinsService = {
  /**
   * Épingle ou désépingle un message.
   *
   * Le backend reste responsable de vérifier :
   * - l'existence du message ;
   * - l'appartenance de l'utilisateur à la conversation ;
   * - l'inversion de isPinned.
   */
  async togglePin(
    mutation: TogglePinMutation,
    messageId: Id<"messages">,
  ): Promise<boolean> {
    return mutation({
      messageId,
    });
  },
};

export default pinsService;
