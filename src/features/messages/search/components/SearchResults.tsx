// src/features/messages/search/components/SearchResults.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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
      <View style={styles.loadingContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index} style={styles.skeleton} />
        ))}
      </View>
    );
  }

  if (messages.length === 0 && conversations.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <MessageCircle size={20} color="rgba(255,255,255,0.25)" />
        </View>

        <Text style={styles.emptyTitle}>Aucun résultat</Text>

        <Text style={styles.emptyDescription}>
          Essaie avec un autre terme de recherche.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={14} color="rgba(255,255,255,0.30)" />

            <Text style={styles.sectionTitle}>Conversations</Text>
          </View>

          <View style={styles.items}>
            {conversations.map((conversation) => {
              const initial = conversation.name.trim().charAt(0).toUpperCase();

              return (
                <Pressable
                  key={conversation.conversationId}
                  onPress={() => onConversationClick?.(conversation)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir la conversation ${conversation.name}`}
                  style={({ pressed }) => [
                    styles.conversationItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.conversationAvatar}>
                    {conversation.avatar ? (
                      <Image
                        source={{
                          uri: conversation.avatar,
                        }}
                        accessibilityLabel=""
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarInitial}>{initial}</Text>
                    )}
                  </View>

                  <View style={styles.conversationContent}>
                    <Text style={styles.conversationName} numberOfLines={1}>
                      {conversation.name}
                    </Text>

                    <Text style={styles.conversationType} numberOfLines={1}>
                      {conversation.isGroup ? "Groupe" : "Conversation"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {messages.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={14} color="rgba(255,255,255,0.30)" />

            <Text style={styles.sectionTitle}>Messages</Text>
          </View>

          <View style={styles.items}>
            {messages.map((message) => {
              const initial = message.senderName.trim().charAt(0).toUpperCase();

              return (
                <Pressable
                  key={message.messageId}
                  onPress={() => onMessageClick?.(message)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir le message de ${message.senderName}`}
                  style={({ pressed }) => [
                    styles.messageItem,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.messageAvatar}>
                    {message.senderAvatar ? (
                      <Image
                        source={{
                          uri: message.senderAvatar,
                        }}
                        accessibilityLabel=""
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.messageAvatarInitial}>{initial}</Text>
                    )}
                  </View>

                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.senderName} numberOfLines={1}>
                        {message.senderName}
                      </Text>

                      <Text style={styles.conversationName} numberOfLines={1}>
                        {message.conversationName}
                      </Text>
                    </View>

                    <Text style={styles.messageText} numberOfLines={3}>
                      {message.text}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 16,
    gap: 20,
  },

  loadingContainer: {
    width: "100%",
    gap: 8,
    padding: 16,
  },

  skeleton: {
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  emptyTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.50)",
  },

  emptyDescription: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.25)",
  },

  section: {
    width: "100%",
    gap: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },

  items: {
    gap: 4,
  },

  conversationItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },

  messageItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },

  pressed: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  conversationAvatar: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  messageAvatar: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },

  messageAvatarInitial: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
  },

  conversationContent: {
    flex: 1,
    minWidth: 0,
  },

  messageContent: {
    flex: 1,
    minWidth: 0,
  },

  conversationName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },

  conversationType: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },

  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  senderName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },

  messageText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    color: "rgba(255,255,255,0.45)",
  },
});

export default SearchResults;
