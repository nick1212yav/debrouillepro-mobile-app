// src/features/messages/conversations/components/ConversationItem.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ConversationPreview } from "../services/conversations.service";

interface ConversationItemProps {
  conversation: ConversationPreview;
  active?: boolean;
  onClick?: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

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
  const title = conversation.title?.trim() || "Conversation";
  const initial = title.charAt(0).toUpperCase() || "?";
  const unreadCount = Math.max(0, conversation.unreadCount ?? 0);
  const lastMessageText =
    conversation.lastMessageText?.trim() || "Aucun message";

  return (
    <Pressable
      onPress={onClick}
      disabled={!onClick}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${title}`}
      accessibilityState={{
        selected: active,
        disabled: !onClick,
      }}
      style={({ pressed }) => [
        styles.container,
        active && styles.containerActive,
        pressed && onClick ? styles.containerPressed : undefined,
      ]}
    >
      <View
        style={styles.avatarWrapper}
        accessibilityLabel={`Avatar de ${title}`}
      >
        {conversation.avatar ? (
          <Image
            style={styles.avatarImage}
            source={{ uri: conversation.avatar }}
            resizeMode="cover"
            accessibilityLabel={`Photo de ${title}`}
          />
        ) : (
          <Text style={styles.avatarInitial}>{initial}</Text>
        )}

        {conversation.isGroup ? (
          <View
            style={styles.groupBadge}
            accessibilityLabel="Conversation de groupe"
          >
            <Text style={styles.groupBadgeText}>👥</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>

          <Text style={styles.time}>{formatDate(conversation.updatedAt)}</Text>
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.preview} numberOfLines={1} ellipsizeMode="tail">
            {lastMessageText}
          </Text>

          {unreadCount > 0 ? (
            <View
              style={styles.unreadBadge}
              accessibilityLabel={`${unreadCount} message${
                unreadCount > 1 ? "s" : ""
              } non lu${unreadCount > 1 ? "s" : ""}`}
            >
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  containerActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  containerPressed: {
    opacity: 0.72,
  },

  avatarWrapper: {
    position: "relative",
    width: 48,
    height: 48,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.70)",
  },

  groupBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
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
