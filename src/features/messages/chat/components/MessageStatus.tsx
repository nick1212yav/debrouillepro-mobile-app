import { Text } from "react-native";

interface MessageStatusProps {
  status?: string;
}

export function MessageStatus({ status }: MessageStatusProps) {
  switch (status) {
    case "read":
      return (
        <Text title="Lu" accessibilityLabel="Lu" className="font-semibold">
          ✓✓
        </Text>
      );

    case "delivered":
      return (
        <Text title="Distribué" accessibilityLabel="Distribué">
          ✓✓
        </Text>
      );

    case "sent":
      return (
        <Text title="Envoyé" accessibilityLabel="Envoyé">
          ✓
        </Text>
      );

    default:
      return null;
  }
}

export default MessageStatus;
