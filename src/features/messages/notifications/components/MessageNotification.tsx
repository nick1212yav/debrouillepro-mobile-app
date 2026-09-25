import { View, Image, Text, Pressable, StyleSheet } from "react-native";

// src/features/messages/notifications/components/MessageNotification.tsx

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
    case "mention": return "@";
    case "reply": return "↩️";
    case "reaction": return "❤️";
    case "call": return "📞";
    case "system": return "ℹ️";
    case "message":
    default: return "💬";
  }
}

function formatNotificationTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}

export function MessageNotification({
  notification,
  onClick,
  onMarkAsRead,
  onRemove,
  compact = false,
}: MessageNotificationProps) {
  const handleClick = () => {
    onClick?.(notification);
    if (!notification.read) onMarkAsRead?.(notification);
  };

  const avatarSize = compact ? 34 : 42;
  const titleSize = compact ? 13 : 14;
  const bodySize = compact ? 12 : 13;
  const iconSize = compact ? 16 : 19;

  return (
    <Pressable
      accessibilityRole={onClick ? "button" : undefined}
      onPress={onClick ? handleClick : undefined}
      style={[
        styles.container,
        compact ? styles.containerCompact : styles.containerRegular,
        notification.read ? styles.containerRead : styles.containerUnread,
      ]}
    >
      {notification.senderAvatar ? (
        <Image
          style={[styles.avatar, { width: avatarSize, height: avatarSize, minWidth: avatarSize, borderRadius: avatarSize / 2 }]}
          source={{ uri: notification.senderAvatar }}
          accessibilityLabel={notification.senderName ?? "Utilisateur"}
        />
      ) : (
        <View
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          style={[styles.avatar, styles.avatarPlaceholder, { width: avatarSize, height: avatarSize, minWidth: avatarSize, borderRadius: avatarSize / 2 }]}
        >
          <Text style={{ fontSize: iconSize }}>{getNotificationIcon(notification.type)}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.time}>{formatNotificationTime(notification.timestamp)}</Text>
        </View>
        {notification.body && (
          <Text style={[styles.bodyText, { fontSize: bodySize }]} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
      </View>

      {!notification.read && <View style={styles.unreadDot} accessibilityLabel="Non lu" />}

      {onRemove && (
        <Pressable
          accessibilityLabel="Supprimer la notification"
          onPress={() => onRemove(notification)}
          style={styles.removeButton}
        >
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", flexDirection: "row", alignItems: "center", borderRadius: 10 },
  containerCompact: { gap: 8, paddingVertical: 8, paddingHorizontal: 10 },
  containerRegular: { gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  containerRead: { backgroundColor: "transparent" },
  containerUnread: { backgroundColor: "rgba(59, 130, 246, 0.08)" },
  avatar: { overflow: "hidden" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#e5e7eb" },
  body: { flex: 1, minWidth: 0, flexDirection: "column", gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  title: { flex: 1, fontWeight: "700", color: "#111827" },
  time: { flexShrink: 0, fontSize: 11, opacity: 0.55, color: "#6b7280" },
  bodyText: { lineHeight: 18, opacity: 0.72, color: "#4b5563" },
  unreadDot: { width: 8, height: 8, minWidth: 8, borderRadius: 4, backgroundColor: "#2563eb" },
  removeButton: { padding: 4, opacity: 0.55 },
  removeText: { fontSize: 15, color: "#6b7280" },
});

export default MessageNotification;