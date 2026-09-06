import type { Id } from "@/convex/_generated/dataModel";

import type { CallType, StartCallResult } from "../types/call.types";

type StartCallMutation = (args: {
  conversationId: Id<"conversations">;
  type: CallType;
}) => Promise<StartCallResult>;

type CallMutation = (args: { callId: Id<"calls"> }) => Promise<unknown>;

type CleanupMutation = (args: {
  conversationId: Id<"conversations">;
  timeoutMinutes?: number;
}) => Promise<{ cleaned: number }>;

export const callService = {
  startCall(
    mutation: StartCallMutation,
    conversationId: Id<"conversations">,
    type: CallType,
  ) {
    return mutation({
      conversationId,
      type,
    });
  },

  answerCall(mutation: CallMutation, callId: Id<"calls">) {
    return mutation({ callId });
  },

  rejectCall(mutation: CallMutation, callId: Id<"calls">) {
    return mutation({ callId });
  },

  endCall(mutation: CallMutation, callId: Id<"calls">) {
    return mutation({ callId });
  },

  markAsMissed(mutation: CallMutation, callId: Id<"calls">) {
    return mutation({ callId });
  },

  cleanupStaleCalls(
    mutation: CleanupMutation,
    conversationId: Id<"conversations">,
    timeoutMinutes = 5,
  ) {
    return mutation({
      conversationId,
      timeoutMinutes,
    });
  },
};

export default callService;
