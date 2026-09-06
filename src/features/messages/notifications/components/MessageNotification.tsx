import { View, Text, Image, GestureResponderEvent, ViewStyle, TextStyle, ImageStyle, Pressable } from "react-native";
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
    case "mention":
      return "@";

    case "reply":
      return "↩";

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
  const handleClick = () => {
    onClick?.(notification);

    if (!notification.read) {
      onMarkAsRead?.(notification);
    }
  };

  const handleRemove = (event: GestureResponderEvent) => {
    onRemove?.(notification);
  };

  const containerStyle: ViewStyle | TextStyle | ImageStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: compact ? 8 : 12,
    padding: compact ? "8px 10px" : "12px 14px",
    boxSizing: "border-box",
    borderRadius: 10,
    backgroundColor: notification.read
      ? "transparent"
      : "rgba(59, 130, 246, 0.08)",
    cursor: onClick ? "pointer" : "default",
    transition: "background-color 0.15s ease",
  };

  return (
    <Pressable
      accessibilityRole={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onPress={handleClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          handleClick();
        }
      }}
      style={containerStyle}
    >
      {notification.senderAvatar ? (
        <Image
         
         
          style={{ width: compact ? 34 : 42, height: compact ? 34 : 42, minWidth: compact ? 34 : 42, borderRadius: "50%" }}
         source={{ uri: notification.senderAvatar }} accessibilityLabel={notification.senderName ?? "Utilisateur"}/>
      ) : (
        <View
         
          style={{ width: compact ? 34 : 42, height: compact ? 34 : 42, minWidth: compact ? 34 : 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--messages-avatar-bg, #e5e7eb)" }}
        >
          {getNotificationIcon(notification.type)}
        </View>
      )}

      <View
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <View
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
          }}
        >
          <strong
            style={{ minWidth: 0, overflow: "hidden", fontSize: compact ? 13 : 14 }}
          >
            {notification.title}
          </strong>

          <Text
            style={{
              marginLeft: "auto",
              flexShrink: 0,
              fontSize: 11,
              opacity: 0.55,
            }}
          >
            {formatNotificationTime(notification.timestamp)}
          </Text>
        </View>

        {notification.body && (
          <View
            style={{ opacity: 0.72, overflow: "hidden" }}
          >
            {notification.body}
          </View>
        )}
      </View>

      {!notification.read && (
        <Text
          accessibilityLabel="Non lu"
          style={{
            width: 8,
            height: 8,
            minWidth: 8,
            borderRadius: "50%",
            backgroundColor: "#2563eb",
          }}
        />
      )}

      {onRemove && (
        <Pressable
          accessibilityLabel="Supprimer la notification"
          onPress={handleRemove}
          style={{ borderWidth: 0, backgroundColor: "transparent", padding: 4, opacity: 0.55 }}
        >
          <Text>×</Text></Pressable>
      )}
    </Pressable>
  );
}

export default MessageNotification;
