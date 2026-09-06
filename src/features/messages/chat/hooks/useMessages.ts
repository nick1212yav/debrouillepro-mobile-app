import { usePaginatedQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import chatService, { type Message } from "../services/chat.service";

export function useMessages(
  conversationId: Id<"conversations"> | null | undefined,
) {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.messages.list,
    conversationId
      ? {
          conversationId,
        }
      : "skip",
    {
      initialNumItems: 30,
    },
  );

  const messages = chatService.sortAscending(results as Message[]);

  return {
    messages,

    status,

    isLoadingFirstPage: status === "LoadingFirstPage",

    isLoadingMore: status === "LoadingMore",

    isDone: status === "Exhausted",

    loadMore: (numItems = 30) => loadMore(numItems),

    hasMessages: messages.length > 0,
  };
}

export default useMessages;
