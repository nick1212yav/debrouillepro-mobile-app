// src/features/messages/pins/hooks/usePinnedMessages.ts

import { useCallback } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { pinsService } from "../services/pins.service";

export function usePinnedMessages(conversationId?: Id<"conversations">) {
  const { isAuthenticated } = useConvexAuth();

  const pinnedMessages = useQuery(
    api.messages.pins.getPinnedMessages,
    isAuthenticated && conversationId
      ? {
          conversationId,
        }
      : "skip",
  );

  const togglePinMutation = useMutation(api.messages.pins.togglePin);

  const togglePin = useCallback(
    async (messageId: Id<"messages">) => {
      return pinsService.togglePin(togglePinMutation, messageId);
    },
    [togglePinMutation],
  );

  return {
    pinnedMessages: pinnedMessages ?? [],
    isLoading: pinnedMessages === undefined,
    togglePin,
  };
}

export default usePinnedMessages;
