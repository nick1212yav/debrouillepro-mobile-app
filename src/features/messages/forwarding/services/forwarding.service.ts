import type { Id } from "@/convex/_generated/dataModel";

export type ForwardTarget = {
  conversationId: Id<"conversations">;
  isGroup: boolean;
  name: string;
  avatar: string | null;
  otherParticipant: {
    _id: Id<"users">;
    name?: string;
    avatar?: string;
  } | null;
};

type ForwardTargetsQuery = () => Promise<ForwardTarget[]>;

type ForwardMessageMutation = (args: {
  messageId: Id<"messages">;
  targetConversationIds: Id<"conversations">[];
}) => Promise<Id<"messages">[]>;

export const forwardingService = {
  async getTargets(query: ForwardTargetsQuery): Promise<ForwardTarget[]> {
    return query();
  },

  async forwardMessage(
    mutation: ForwardMessageMutation,
    messageId: Id<"messages">,
    targetConversationIds: Id<"conversations">[],
  ): Promise<Id<"messages">[]> {
    const uniqueConversationIds = [...new Set(targetConversationIds)];

    if (uniqueConversationIds.length === 0) {
      throw new Error("Sélectionne au moins une conversation.");
    }

    return mutation({
      messageId,
      targetConversationIds: uniqueConversationIds,
    });
  },
};
