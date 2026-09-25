import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useCallback } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import type { Message } from "../services/chat.service";

import { MessageBubble } from "./MessageBubble";

// src/features/messages/chat/components/MessagesArea.tsx

interface MessagesAreaProps {
  messages: Message[];
  currentUserId: Id<"users">;
  isLoadingMore?: boolean;
  isDone?: boolean;
  onLoadMore?: (numItems?: number) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

export function MessagesArea({
  messages,
  currentUserId,
  isLoadingMore = false,
  isDone = false,
  onLoadMore,
  onReply,
  onForward,
}: MessagesAreaProps) {
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      if (y <= 120 && !isLoadingMore && !isDone && onLoadMore) {
        onLoadMore(30);
      }
    },
    [isLoadingMore, isDone, onLoadMore],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      onScroll={handleScroll}
      scrollEventThrottle={100}
      keyboardShouldPersistTaps="handled"
    >
      {isLoadingMore && (
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>
            Chargement des anciens messages...
          </Text>
        </View>
      )}

      <View style={styles.list}>
        {messages.map((message) => (
          <MessageBubble
            key={String(message._id)}
            message={message}
            currentUserId={currentUserId}
            onReply={onReply}
            onForward={onForward}
          />
        ))}

        {messages.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun message.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingRow: {
    marginBottom: 16,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.3)",
  },
  list: {
    maxWidth: 768,
    alignSelf: "center",
    width: "100%",
    gap: 8,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
  },
});

export default MessagesArea;