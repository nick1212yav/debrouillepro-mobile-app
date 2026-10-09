// src/features/messages/search/components/MessageSearch.tsx

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
    <View style={styles.container}>
      {/* Search header */}
      <View style={styles.header}>
        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer la recherche"
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <X size={18} color="rgba(255,255,255,0.40)" />
          </Pressable>
        ) : null}

        <View style={styles.searchBar}>
          {isLoading ? (
            <Loader2 size={17} color="#a78bfa" />
          ) : (
            <Search size={17} color="rgba(255,255,255,0.30)" />
          )}

          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={
              conversationId
                ? "Rechercher dans la conversation..."
                : "Rechercher dans les messages..."
            }
            placeholderTextColor="rgba(255,255,255,0.25)"
            returnKeyType="search"
            style={styles.input}
            accessibilityLabel="Recherche dans la messagerie"
          />

          {query ? (
            <Pressable
              onPress={clear}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
              hitSlop={8}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.pressed,
              ]}
            >
              <X size={16} color="rgba(255,255,255,0.30)" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <SearchFilters value={filter} onChange={setFilter} />

      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!query.trim() ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Search size={23} color="#a78bfa" />
            </View>

            <Text style={styles.emptyTitle}>Rechercher dans la messagerie</Text>

            <Text style={styles.emptyDescription}>
              Recherche un mot, une phrase ou un nom de conversation.
            </Text>
          </View>
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
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1120",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  closeButton: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  searchBar: {
    flex: 1,
    minWidth: 0,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  input: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingVertical: 0,
    fontSize: 14,
    color: "#ffffff",
  },

  clearButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },

  pressed: {
    opacity: 0.6,
  },

  resultsContainer: {
    flex: 1,
  },

  resultsContent: {
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 64,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(255,255,255,0.60)",
  },

  emptyDescription: {
    maxWidth: 320,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(255,255,255,0.30)",
  },
});

export default MessageSearch;
