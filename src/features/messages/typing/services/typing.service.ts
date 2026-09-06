import type { Id } from "@/convex/_generated/dataModel";

export type TypingUser = {
  userId: Id<"users">;
  name: string;
  image?: string;
  lastActiveAt: number;
};

type StartTypingFn = (args: {
  conversationId: Id<"conversations">;
}) => Promise<Id<"typingIndicators">>;

type StopTypingFn = (args: {
  conversationId: Id<"conversations">;
}) => Promise<Id<"typingIndicators"> | null>;

type CleanupTypingFn = (args: {
  conversationId: Id<"conversations">;
}) => Promise<{
  cleaned: number;
}>;

export const typingService = {
  start(mutation: StartTypingFn, conversationId: Id<"conversations">) {
    return mutation({ conversationId });
  },

  stop(mutation: StopTypingFn, conversationId: Id<"conversations">) {
    return mutation({ conversationId });
  },

  cleanup(mutation: CleanupTypingFn, conversationId: Id<"conversations">) {
    return mutation({ conversationId });
  },
};

export default typingService;
