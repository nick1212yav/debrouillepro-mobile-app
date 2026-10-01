import { Text } from "react-native";

// src/features/messages/chat/components/MessageStatus.tsx

type MessageStatusValue = "sent" | "delivered" | "read";

interface MessageStatusProps {
  status?: MessageStatusValue | string;
}

export function MessageStatus({ status }: MessageStatusProps) {
  switch (status) {
    case "read":
      return (
        <Text
          className="text-[12px] font-semibold leading-4 text-emerald-400"
          accessibilityRole="text"
          accessibilityLabel="Lu"
        >
          ✓✓
        </Text>
      );

    case "delivered":
      return (
        <Text
          className="text-[12px] font-semibold leading-4 text-white/45"
          accessibilityRole="text"
          accessibilityLabel="Distribué"
        >
          ✓✓
        </Text>
      );

    case "sent":
      return (
        <Text
          className="text-[12px] font-semibold leading-4 text-white/45"
          accessibilityRole="text"
          accessibilityLabel="Envoyé"
        >
          ✓
        </Text>
      );

    default:
      return null;
  }
}

export default MessageStatus;
