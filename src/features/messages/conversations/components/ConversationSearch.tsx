import { Text, Pressable, View, TextInput } from "react-native";
import { useMemo, useState } from "react";

import type { ConversationPreview } from "../services/conversations.service";

interface ConversationSearchProps {
  conversations: ConversationPreview[];
  onSelect: (conversation: ConversationPreview) => void;
}

export function ConversationSearch({
  conversations,
  onSelect,
}: ConversationSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return [];
    }

    return conversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(normalized) ||
        (conversation.lastMessageText ?? "").toLowerCase().includes(normalized),
    );
  }, [conversations, query]);

  return (
    <View className="relative">
      <TextInput value={query} onChangeText={(value) => setQuery(value)} placeholder="Rechercher une conversation..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/20" />

      {results.length > 0 && (
        <View className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-black p-1 shadow-2xl">
          {results.map((conversation) => (
            <Pressable key={String(conversation.conversationId)} onPress={() => onSelect(conversation)} className="w-full rounded-lg px-3 py-2 text-left">
              <Text className="truncate text-sm text-white">
                {conversation.title}
              </Text>

              <Text className="truncate text-xs text-white/40">
                {conversation.lastMessageText || "Aucun message"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default ConversationSearch;
