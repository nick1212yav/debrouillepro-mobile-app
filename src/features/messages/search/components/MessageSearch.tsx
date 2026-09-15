import { View, Pressable, TextInput, Text } from "react-native";
import { Loader2, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import { useMessageSearch } from "../hooks/useMessageSearch";

import { SearchFilters, type SearchFilter } from "./SearchFilters";

import { SearchResults } from "./SearchResults";

interface MessageSearchProps {
  conversationId?: Id<"conversations">;
  onMessageClick?: (messageId: Id<"messages">) => void;
  onConversationClick?: (conversationId: Id<"conversations">) => void;
  onClose?: () => void;
}

export function MessageSearch({
  conversationId,
  onMessageClick,
  onConversationClick,
  onClose,
}: MessageSearchProps) {
  const [filter, setFilter] = useState<SearchFilter>("all");

  const { query, setQuery, clear, messages, conversations, isLoading } =
    useMessageSearch({
      conversationId,
    });

  const filteredMessages = useMemo(() => {
    if (filter === "conversations") {
      return [];
    }

    return messages;
  }, [filter, messages]);

  const filteredConversations = useMemo(() => {
    if (filter === "messages") {
      return [];
    }

    return conversations;
  }, [filter, conversations]);

  return (
    <View className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0b1120]"><View className="flex items-center gap-2 border-b border-white/10 px-4 py-3">{onClose && (
          <Pressable onPress={onClose} accessibilityLabel="Fermer la recherche" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40"><X size={18} /></Pressable>
        )}<View className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">{isLoading ? (
            <Loader2
              size={17}
              className="shrink-0 animate-spin text-violet-400"
            />
          ) : (
            <Search size={17} className="shrink-0 text-white/30" />
          )}<TextInput autoFocus value={query} onChangeText={(value) => setQuery(value)} placeholder={conversationId
                ? "Rechercher dans la conversation..."
                : "Rechercher dans les messages..."} className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25" returnKeyType="search" />{query && (
            <Pressable onPress={clear} accessibilityLabel="Effacer la recherche" className="text-white/30"><X size={16} /></Pressable>
          )}</View></View><SearchFilters value={filter} onChange={setFilter} /><View className="min-h-0 flex-1 overflow-y-auto">{!query.trim() ? (
          <View className="flex flex-col items-center justify-center px-6 py-16 text-center"><View className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10"><Search size={23} className="text-violet-400" /></View><Text className="text-sm font-medium text-white/60">Rechercher dans la messagerie
            </Text><Text className="mt-1 max-w-xs text-xs leading-5 text-white/30">Recherche un mot, une phrase ou un nom de conversation.
            </Text></View>
        ) : (
          <SearchResults
            messages={filteredMessages}
            conversations={filteredConversations}
            isLoading={isLoading}
            onMessageClick={(message) => onMessageClick?.(message.messageId)}
            onConversationClick={(conversation) =>
              onConversationClick?.(conversation.conversationId)
            }
          />
        )}</View></View>
  );
}

export default MessageSearch;
