import { Text, StyleSheet } from "react-native";

// src/features/messages/chat/components/MessageStatus.tsx

interface MessageStatusProps {
  status?: string;
}

export function MessageStatus({ status }: MessageStatusProps) {
  switch (status) {
    case "read":
      return (
        <Text
          accessibilityLabel="Lu"
          style={styles.read}
        >
          ✓✓
        </Text>
      );

    case "delivered":
      return (
        <Text
          accessibilityLabel="Distribué"
          style={styles.delivered}
        >
          ✓✓
        </Text>
      );

    case "sent":
      return (
        <Text
          accessibilityLabel="Envoyé"
          style={styles.sent}
        >
          ✓
        </Text>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  read: {
    fontWeight: "600",
    color: "#22c55e",
    fontSize: 12,
  },
  delivered: {
    fontWeight: "600",
    color: "#9ca3af",
    fontSize: 12,
  },
  sent: {
    fontWeight: "600",
    color: "#9ca3af",
    fontSize: 12,
  },
});

export default MessageStatus;