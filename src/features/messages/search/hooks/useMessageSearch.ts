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

  const shouldSearch = enabled && normalizedQuery.length > 0;

  const searchLimit = options?.limit ?? 30;

  const messages = useQuery(
    api.messages.search.searchMessages,
    shouldSearch
      ? {
          query: normalizedQuery,
          conversationId: options?.conversationId,
          limit: searchLimit,
        }
      : "skip",
  );

  const conversations = useQuery(
    api.messages.search.searchConversations,
    shouldSearch
      ? {
          query: normalizedQuery,
          limit: searchLimit,
        }
      : "skip",
  );

  const global = useQuery(
    api.messages.search.globalSearch,
    shouldSearch
      ? {
          query: normalizedQuery,
          limit: options?.limit ?? 20,
        }
      : "skip",
  );

  /*
   * Les fonctions Convex générées
   * restent la source de vérité pour
   * les types retournés.
   *
   * On normalise uniquement undefined
   * vers des tableaux vides.
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
    shouldSearch &&
    (messages === undefined ||
      conversations === undefined ||
      global === undefined);

  const clear = () => {
    setQuery("");
  };

  const hasResults =
    messageResults.length > 0 || conversationResults.length > 0;

  const hasGlobalResults =
    globalMessages.length > 0 || globalConversations.length > 0;

  return {
    query,
    setQuery,
    clear,

    messages: messageResults as MessageSearchResult[],

    conversations: conversationResults,

    globalMessages: globalMessages as MessageSearchResult[],

    globalConversations: globalConversations,

    globalResult: global ?? {
      messages: [],
      conversations: [],
    },

    hasResults,
    hasGlobalResults,

    isLoading,
    isAuthenticated,
    enabled,
  };
}

export { searchService };

export default useMessageSearch;
