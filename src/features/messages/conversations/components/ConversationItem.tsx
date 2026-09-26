import { Pressable, View, Text, Image, StyleSheet } from "react-native";

// src/features/messages/conversations/components/ConversationItem.tsx

import type { ConversationPreview } from "../services/conversations.service";

interface ConversationItemProps {
  conversation: ConversationPreview;
  active?: boolean;
  onClick?: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationItem({
  conversation,
  active = false,
  onClick,
}: ConversationItemProps) {
  const title = conversation.title || "Conversation";

  return (
    <Pressable
      onPress={onClick}
      style={[styles.container, active && styles.containerActive]}
    >
      <View style={styles.avatarWrapper}>
        {conversation.avatar ? (
          <Image
            style={styles.avatarImage}
            source={{ uri: conversation.avatar }}
            accessibilityLabel={title}
          />
        ) : (
          <Text style={styles.avatarInitial}>
            {title.charAt(0).toUpperCase()}
          </Text>
        )}
        {conversation.isGroup && (
          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>👥</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.time}>
            {formatDate(conversation.updatedAt)}
          </Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {conversation.lastMessageText || "Aucun message"}
          </Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  containerActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  avatarWrapper: {
    position: "relative",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontWeight: "600",
    color: "rgba(255,255,255,0.70)",
    fontSize: 16,
  },
  groupBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#000000",
  },
  groupBadgeText: {
    fontSize: 9,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  time: {
    flexShrink: 0,
    fontSize: 11,
    color: "rgba(255,255,255,0.40)",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  preview: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: "rgba(255,255,255,0.50)",
  },
  unreadBadge: {
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000000",
  },
});

export default ConversationItem;