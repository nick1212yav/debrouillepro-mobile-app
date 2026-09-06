import type { Id } from "@/convex/_generated/dataModel";

type TogglePinMutation = (args: {
  messageId: Id<"messages">;
}) => Promise<boolean>;

export const pinsService = {
  /**
   * Épingle ou désépingle un message.
   *
   * Le backend se charge de vérifier :
   * - que le message existe ;
   * - que l'utilisateur appartient à la conversation ;
   * - puis inverse isPinned.
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
