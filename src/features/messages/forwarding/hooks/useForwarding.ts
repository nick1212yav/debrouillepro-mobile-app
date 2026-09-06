import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  forwardingService,
  type ForwardTarget,
} from "../services/forwarding.service";

export function useForwarding(messageId?: Id<"messages">) {
  const { isAuthenticated } = useConvexAuth();

  const targets = useQuery(
    api.messages.forwarding.getForwardTargets,
    isAuthenticated ? {} : "skip",
  );

  const forwardMutation = useMutation(api.messages.forwarding.forwardMessage);

  const forward = async (targetConversationIds: Id<"conversations">[]) => {
    if (!messageId) {
      throw new Error("Aucun message sélectionné pour le transfert.");
    }

    return forwardingService.forwardMessage(
      forwardMutation,
      messageId,
      targetConversationIds,
    );
  };

  return {
    targets: (targets ?? []) as ForwardTarget[],
    isLoadingTargets: isAuthenticated && targets === undefined,
    forward,
  };
}

export default useForwarding;
