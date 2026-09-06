// src/features/messages/search/hooks/useMessageSearch.ts

import { useConvexAuth, useQuery } from "convex/react";
import { useMemo, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  searchService,
  type ConversationSearchResult,
  type MessageSearchResult,
} from "../services/search.service";

export function useMessageSearch(options?: {
  conversationId?: Id<"conversations">;
  limit?: number;
  enabled?: boolean;
}) {
  const { isAuthenticated } = useConvexAuth();

  const [query, setQuery] = useState("");

  const enabled = options?.enabled !== false && isAuthenticated;

  const normalizedQuery = query.trim();

  const messages = useQuery(
    api.messages.search.searchMessages,
    enabled && normalizedQuery.length > 0
      ? {
          query: normalizedQuery,
          conversationId: options?.conversationId,
          limit: options?.limit ?? 30,
        }
      : "skip",
  );

  const conversations = useQuery(
    api.messages.search.searchConversations,
    enabled && normalizedQuery.length > 0
      ? {
          query: normalizedQuery,
          limit: options?.limit ?? 30,
        }
      : "skip",
  );

  const global = useQuery(
    api.messages.search.globalSearch,
    enabled && normalizedQuery.length > 0
      ? {
          query: normalizedQuery,
          limit: options?.limit ?? 20,
        }
      : "skip",
  );

  /*
   * Les résultats sont déjà typés par les fonctions Convex générées.
   * On conserve ici uniquement une normalisation de undefined -> [].
   *
   * IMPORTANT :
   * Si TypeScript signale ici que `messageId` est `string`,
   * le problème se trouve dans le retour de
   * `convex/messages/search.ts`, pas dans ce hook.
   */
  const messageResults = useMemo(() => messages ?? [], [messages]);

  const conversationResults = useMemo<ConversationSearchResult[]>(
    () => conversations ?? [],
    [conversations],
  );

  const globalMessages = useMemo(() => global?.messages ?? [], [global]);

  const globalConversations = useMemo<ConversationSearchResult[]>(
    () => global?.conversations ?? [],
    [global],
  );

  const isLoading =
    enabled &&
    normalizedQuery.length > 0 &&
    (messages === undefined ||
      conversations === undefined ||
      global === undefined);

  const clear = () => {
    setQuery("");
  };

  return {
    query,
    setQuery,
    clear,

    messages: messageResults as MessageSearchResult[],
    conversations: conversationResults,

    globalMessages: globalMessages as MessageSearchResult[],
    globalConversations,

    globalResult: global ?? {
      messages: [],
      conversations: [],
    },

    hasResults: messageResults.length > 0 || conversationResults.length > 0,

    hasGlobalResults:
      globalMessages.length > 0 || globalConversations.length > 0,

    isLoading,
    isAuthenticated,
    enabled,
  };
}

export { searchService };

export default useMessageSearch;
