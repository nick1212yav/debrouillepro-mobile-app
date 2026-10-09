import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

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

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return conversations.filter((conversation) => {
      const title = conversation.title?.toLowerCase() ?? "";
      const lastMessage = conversation.lastMessageText?.toLowerCase() ?? "";

      return (
        title.includes(normalizedQuery) || lastMessage.includes(normalizedQuery)
      );
    });
  }, [conversations, normalizedQuery]);

  return (
    <View className="relative">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Rechercher une conversation..."
        placeholderTextColor="rgba(255,255,255,0.30)"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Rechercher une conversation"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white"
      />

      {results.length > 0 ? (
        <View className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-hidden rounded-xl border border-white/10 bg-black p-1 shadow-2xl">
          {results.map((conversation) => {
            const title = conversation.title?.trim() || "Conversation";
            const preview =
              conversation.lastMessageText?.trim() || "Aucun message";

            return (
              <Pressable
                key={String(conversation.conversationId)}
                onPress={() => onSelect(conversation)}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir ${title}`}
                className="w-full rounded-lg px-3 py-2 active:bg-white/10"
              >
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="text-sm text-white"
                >
                  {title}
                </Text>

                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="mt-0.5 text-xs text-white/40"
                >
                  {preview}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {normalizedQuery && results.length === 0 ? (
        <View className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-white/10 bg-black p-4 shadow-2xl">
          <Text className="text-center text-sm text-white/50">
            Aucune conversation trouvée.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default ConversationSearch;
