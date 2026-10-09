// src/features/messages/pins/components/PinnedMessages.tsx

import { Pin, X } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { usePinnedMessages } from "../hooks/usePinnedMessages";
import { PinnedMessageItem } from "./PinnedMessageItem";

interface PinnedMessagesProps {
  conversationId: Id<"conversations">;
  onClose?: () => void;
  onSelectMessage?: (messageId: Id<"messages">) => void;
  senderNames?: Record<string, string>;
  className?: string;
}

export function PinnedMessages({
  conversationId,
  onClose,
  onSelectMessage,
  senderNames,
}: PinnedMessagesProps) {
  const { pinnedMessages, isLoading, togglePin } =
    usePinnedMessages(conversationId);

  const handleUnpin = async (messageId: Id<"messages">) => {
    await togglePin(messageId);
  };

  const countLabel = isLoading
    ? "Chargement..."
    : `${pinnedMessages.length} ${
        pinnedMessages.length > 1 ? "messages" : "message"
      }`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View
            style={styles.headerIcon}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Pin size={17} color="#a78bfa" style={styles.pinIcon} />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>Messages épinglés</Text>

            <Text style={styles.count}>{countLabel}</Text>
          </View>
        </View>

        {onClose ? (
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Fermer les messages épinglés"
            hitSlop={8}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <X size={17} color="rgba(255,255,255,0.45)" />
          </Pressable>
        ) : null}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <LoadingState />
        ) : pinnedMessages.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.messageList}>
            {pinnedMessages.map((message) => (
              <PinnedMessageItem
                key={message._id}
                message={message}
                senderName={senderNames?.[message.senderId]}
                onUnpin={handleUnpin}
                onSelect={onSelectMessage}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LoadingState() {
  return (
    <View
      style={styles.loadingContainer}
      accessibilityLabel="Chargement des messages épinglés"
    >
      <ActivityIndicator size="small" color="#a78bfa" />

      <Text style={styles.loadingText}>
        Chargement des messages épinglés...
      </Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <View
        style={styles.emptyIcon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Pin size={20} color="rgba(255,255,255,0.22)" style={styles.pinIcon} />
      </View>

      <Text style={styles.emptyTitle}>Aucun message épinglé</Text>

      <Text style={styles.emptyDescription}>
        Les messages importants que tu épingles apparaîtront ici.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxHeight: 620,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    backgroundColor: "#111827",
  },

  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  headerIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.10)",
  },

  pinIcon: {
    transform: [{ rotate: "-35deg" }],
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },

  count: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },

  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },

  closeButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  scrollView: {
    width: "100%",
  },

  content: {
    padding: 12,
    paddingBottom: 16,
  },

  messageList: {
    gap: 8,
  },

  loadingContainer: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
  },

  emptyContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  emptyTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.50)",
  },

  emptyDescription: {
    maxWidth: 300,
    marginTop: 4,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.25)",
  },
});

export default PinnedMessages;
