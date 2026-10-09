// src/features/messages/search/services/search.service.ts

import type { Id } from "@/convex/_generated/dataModel";

/* -------------------------------------------------------------------------- */
/*                                  RESULTS                                   */
/* -------------------------------------------------------------------------- */

export type MessageSearchResult = {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  senderId: Id<"users">;
  senderName: string;
  senderAvatar?: string;
  text: string;
  status: "sent" | "delivered" | "read" | "failed";
  replyToId?: Id<"messages">;
  sharedPublicationId?: Id<"publications">;
  conversationName: string;
};

export type ConversationSearchResult = {
  conversationId: Id<"conversations">;
  isGroup: boolean;
  name: string;
  avatar?: string;
  otherUserId?: Id<"users">;
  lastMessageText?: string;
  lastMessageSenderId?: Id<"users">;
  updatedAt: string;
};

export type GlobalSearchResult = {
  conversations: ConversationSearchResult[];
  messages: MessageSearchResult[];
};

/* -------------------------------------------------------------------------- */
/*                                  CONTRACTS                                 */
/* -------------------------------------------------------------------------- */

type SearchMessagesFn = (args: {
  query: string;
  conversationId?: Id<"conversations">;
  limit?: number;
}) => Promise<MessageSearchResult[]>;

type SearchConversationFn = (args: {
  conversationId: Id<"conversations">;
  query: string;
  limit?: number;
}) => Promise<MessageSearchResult[]>;

type SearchConversationsFn = (args: {
  query: string;
  limit?: number;
}) => Promise<ConversationSearchResult[]>;

type GlobalSearchFn = (args: {
  query: string;
  limit?: number;
}) => Promise<GlobalSearchResult>;

/* -------------------------------------------------------------------------- */
/*                                  SERVICE                                   */
/* -------------------------------------------------------------------------- */

export const searchService = {
  searchMessages(
    search: SearchMessagesFn,
    query: string,
    options?: {
      conversationId?: Id<"conversations">;
      limit?: number;
    },
  ): Promise<MessageSearchResult[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return Promise.resolve([]);
    }

    return search({
      query: normalizedQuery,
      conversationId: options?.conversationId,
      limit: options?.limit,
    });
  },

  searchConversation(
    search: SearchConversationFn,
    conversationId: Id<"conversations">,
    query: string,
    limit = 50,
  ): Promise<MessageSearchResult[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return Promise.resolve([]);
    }

    return search({
      conversationId,
      query: normalizedQuery,
      limit,
    });
  },

  searchConversations(
    search: SearchConversationsFn,
    query: string,
    limit = 30,
  ): Promise<ConversationSearchResult[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return Promise.resolve([]);
    }

    return search({
      query: normalizedQuery,
      limit,
    });
  },

  globalSearch(
    search: GlobalSearchFn,
    query: string,
    limit = 20,
  ): Promise<GlobalSearchResult> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return Promise.resolve({
        conversations: [],
        messages: [],
      });
    }

    return search({
      query: normalizedQuery,
      limit,
    });
  },
};

export default searchService;
