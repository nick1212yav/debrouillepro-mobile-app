// src/features/messages/notifications/components/MessageNotification.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { MessageNotification as MessageNotificationData } from "../services/notifications.service";

export interface MessageNotificationProps {
  notification: MessageNotificationData;
  onClick?: (notification: MessageNotificationData) => void;
  onMarkAsRead?: (notification: MessageNotificationData) => void;
  onRemove?: (notification: MessageNotificationData) => void;
  compact?: boolean;
}

function getNotificationIcon(type: MessageNotificationData["type"]): string {
  switch (type) {
    case "mention":
      return "@";
    case "reply":
      return "↩️";
    case "reaction":
      return "❤️";
    case "call":
      return "📞";
    case "system":
      return "ℹ️";
    case "message":
    default:
      return "💬";
  }
}

function formatNotificationTime(timestamp: number): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
  });
}

export function MessageNotification({
  notification,
  onClick,
  onMarkAsRead,
  onRemove,
  compact = false,
}: MessageNotificationProps) {
  const handlePress = () => {
    onClick?.(notification);

    if (!notification.read) {
      onMarkAsRead?.(notification);
    }
  };

  const avatarSize = compact ? 34 : 42;
  const iconSize = compact ? 16 : 19;

  const accessibilityLabel = [
    notification.title,
    notification.body,
    notification.read ? undefined : "Non lu",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole={onClick ? "button" : undefined}
      accessibilityLabel={accessibilityLabel || "Notification"}
      accessibilityState={{
        selected: !notification.read,
      }}
      onPress={onClick ? handlePress : undefined}
      style={({ pressed }) => [
        styles.container,
        compact ? styles.containerCompact : styles.containerRegular,
        notification.read ? styles.containerRead : styles.containerUnread,
        pressed && styles.containerPressed,
      ]}
    >
      {notification.senderAvatar ? (
        <Image
          accessibilityLabel={notification.senderName ?? "Utilisateur"}
          resizeMode="cover"
          source={{
            uri: notification.senderAvatar,
          }}
          style={[
            styles.avatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={[styles.icon, { fontSize: iconSize }]}>
            {getNotificationIcon(notification.type)}
          </Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={[styles.title, compact && styles.titleCompact]}
          >
            {notification.title}
          </Text>

          <Text style={styles.time}>
            {formatNotificationTime(notification.timestamp)}
          </Text>
        </View>

        {notification.body ? (
          <Text
            numberOfLines={2}
            style={[styles.bodyText, compact && styles.bodyTextCompact]}
          >
            {notification.body}
          </Text>
        ) : null}
      </View>

      {!notification.read ? (
        <View
          accessibilityLabel="Non lu"
          accessibilityRole="image"
          style={styles.unreadDot}
        />
      ) : null}

      {onRemove ? (
        <Pressable
          accessibilityLabel="Supprimer la notification"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onRemove(notification)}
          style={({ pressed }) => [
            styles.removeButton,
            pressed && styles.removeButtonPressed,
          ]}
        >
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
  },

  containerCompact: {
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  containerRegular: {
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  containerRead: {
    backgroundColor: "transparent",
  },

  containerUnread: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },

  containerPressed: {
    opacity: 0.78,
  },

  avatar: {
    overflow: "hidden",
  },

  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
  },

  icon: {
    color: "#d1d5db",
  },

  body: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    gap: 3,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  titleCompact: {
    fontSize: 13,
  },

  time: {
    flexShrink: 0,
    fontSize: 11,
    color: "#9ca3af",
    opacity: 0.75,
  },

  bodyText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#d1d5db",
    opacity: 0.78,
  },

  bodyTextCompact: {
    fontSize: 12,
  },

  unreadDot: {
    width: 8,
    height: 8,
    minWidth: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },

  removeButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },

  removeButtonPressed: {
    opacity: 0.5,
  },

  removeText: {
    fontSize: 18,
    lineHeight: 20,
    color: "#9ca3af",
  },
});

export default MessageNotification;
