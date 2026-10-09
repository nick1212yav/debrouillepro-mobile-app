// src/features/messages/calls/services/call.service.ts

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
  // ==========================================================================
  // START
  // ==========================================================================

  startCall(
    mutation: StartCallMutation,
    conversationId: Id<"conversations">,
    type: CallType,
  ): Promise<StartCallResult> {
    return mutation({
      conversationId,
      type,
    });
  },

  // ==========================================================================
  // ANSWER
  // ==========================================================================

  answerCall(mutation: CallMutation, callId: Id<"calls">): Promise<unknown> {
    return mutation({ callId });
  },

  // ==========================================================================
  // REJECT
  // ==========================================================================

  rejectCall(mutation: CallMutation, callId: Id<"calls">): Promise<unknown> {
    return mutation({ callId });
  },

  // ==========================================================================
  // END
  // ==========================================================================

  endCall(mutation: CallMutation, callId: Id<"calls">): Promise<unknown> {
    return mutation({ callId });
  },

  // ==========================================================================
  // MISSED
  // ==========================================================================

  markAsMissed(mutation: CallMutation, callId: Id<"calls">): Promise<unknown> {
    return mutation({ callId });
  },

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  cleanupStaleCalls(
    mutation: CleanupMutation,
    conversationId: Id<"conversations">,
    timeoutMinutes = 5,
  ): Promise<{ cleaned: number }> {
    return mutation({
      conversationId,
      timeoutMinutes,
    });
  },
};

export default callService;
