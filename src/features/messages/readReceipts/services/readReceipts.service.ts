import type { Id } from "@/convex/_generated/dataModel";

export type ReadReceipt = {
  _id: Id<"readReceipts">;
  _creationTime: number;
  messageId: Id<"messages">;
  userId: Id<"users">;
  readAt: string;
};

export type ConversationReadReceipts = {
  messageId: Id<"messages">;
  receipts: ReadReceipt[];
};

export type ReadStatus = {
  read: boolean;
  readAt: string | null;
};

type MarkAsReadMutation = (args: {
  messageId: Id<"messages">;
}) => Promise<Id<"readReceipts">>;

type MarkManyAsReadMutation = (args: {
  messageIds: Id<"messages">[];
}) => Promise<Id<"readReceipts">[]>;

export const readReceiptsService = {
  markAsRead(mutation: MarkAsReadMutation, messageId: Id<"messages">) {
    return mutation({ messageId });
  },

  markManyAsRead(
    mutation: MarkManyAsReadMutation,
    messageIds: Id<"messages">[],
  ) {
    if (messageIds.length === 0) {
      return Promise.resolve([]);
    }

    return mutation({ messageIds });
  },
};

export default readReceiptsService;
