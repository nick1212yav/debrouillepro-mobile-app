import { View, Text, Pressable, Image } from "react-native";
import { FileText, MessageCircle, Users } from "lucide-react-native";

import type {
  ConversationSearchResult,
  MessageSearchResult,
} from "../services/search.service";

interface SearchResultsProps {
  messages: MessageSearchResult[];
  conversations: ConversationSearchResult[];
  onMessageClick?: (message: MessageSearchResult) => void;
  onConversationClick?: (conversation: ConversationSearchResult) => void;
  isLoading?: boolean;
}

export function SearchResults({
  messages,
  conversations,
  onMessageClick,
  onConversationClick,
  isLoading = false,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <View className="space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <View
            key={index}
            className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
          />
        ))}
      </View>
    );
  }

  if (messages.length === 0 && conversations.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <View className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
          <MessageCircle size={20} className="text-white/25" />
        </View>

        <Text className="text-sm text-white/50">Aucun résultat</Text>

        <Text className="mt-1 text-xs text-white/25">
          Essaie avec un autre terme de recherche.
        </Text>
      </View>
    );
  }

  return (
    <View className="space-y-5 p-4">
      {conversations.length > 0 && (
        <View>
          <View className="mb-2 flex items-center gap-2 px-1">
            <Users size={14} className="text-white/30" />
            <Text className="text-xs font-semibold uppercase tracking-wide text-white/35">
              Conversations
            </Text>
          </View>

          <View className="space-y-1">
            {conversations.map((conversation) => (
              <Pressable
                key={conversation.conversationId}
               
                onPress={() => onConversationClick?.(conversation)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left"
              >
                <View className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  {conversation.avatar ? (
                    <Image
                     
                     
                      className="h-full w-full object-cover"
                     source={{ uri: conversation.avatar }} accessibilityLabel=""/>
                  ) : (
                    <Text className="text-sm font-semibold text-white/45">
                      {conversation.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="truncate text-sm font-medium text-white">
                    {conversation.name}
                  </Text>

                  <Text className="truncate text-xs text-white/35">
                    {conversation.isGroup ? "Groupe" : "Conversation"}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {messages.length > 0 && (
        <View>
          <View className="mb-2 flex items-center gap-2 px-1">
            <FileText size={14} className="text-white/30" />
            <Text className="text-xs font-semibold uppercase tracking-wide text-white/35">
              Messages
            </Text>
          </View>

          <View className="space-y-1">
            {messages.map((message) => (
              <Pressable
                key={message.messageId}
               
                onPress={() => onMessageClick?.(message)}
                className="flex w-full gap-3 rounded-xl p-3 text-left"
              >
                <View className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                  {message.senderAvatar ? (
                    <Image
                     
                     
                      className="h-full w-full object-cover"
                     source={{ uri: message.senderAvatar }} accessibilityLabel=""/>
                  ) : (
                    <Text className="text-xs font-semibold text-white/45">
                      {message.senderName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>

                <View className="min-w-0 flex-1">
                  <View className="flex min-w-0 items-center gap-2">
                    <Text className="truncate text-sm font-medium text-white">
                      {message.senderName}
                    </Text>

                    <Text className="shrink-0 text-[11px] text-white/25">
                      {message.conversationName}
                    </Text>
                  </View>

                  <Text className="mt-1 text-xs leading-5 text-white/45">
                    {message.text}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default SearchResults;
