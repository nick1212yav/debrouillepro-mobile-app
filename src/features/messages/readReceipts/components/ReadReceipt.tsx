// src/features/messages/readReceipts/components/ReadReceipt.tsx

import { Pressable, StyleSheet, Text } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { useReadReceipts } from "../hooks/useReadReceipts";

interface ReadReceiptProps {
  messageId: Id<"messages">;
  conversationId?: Id<"conversations">;
  senderId?: Id<"users">;
  currentUserId?: Id<"users">;
  status?: "sent" | "delivered" | "read" | "failed";
  onRead?: (messageId: Id<"messages">) => void;
}

export function ReadReceipt({
  messageId,
  conversationId,
  senderId,
  currentUserId,
  status,
  onRead,
}: ReadReceiptProps) {
  const { getReceiptForMessage, markAsRead } = useReadReceipts({
    conversationId,
  });

  const receipts = getReceiptForMessage(messageId);

  const isOwnMessage = Boolean(
    senderId && currentUserId && senderId === currentUserId,
  );

  const handleMarkAsRead = async () => {
    try {
      await markAsRead(messageId);
      onRead?.(messageId);
    } catch {
      // L'erreur est gérée par le hook.
    }
  };

  if (!isOwnMessage && status !== "read") {
    return (
      <Pressable
        onPress={handleMarkAsRead}
        style={({ pressed }) => [
          styles.markAsReadButton,
          pressed && styles.markAsReadPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Marquer comme lu"
      >
        <Text style={styles.markAsReadText}>Marquer comme lu</Text>
      </Pressable>
    );
  }

  if (isOwnMessage) {
    const hasBeenRead = status === "read" || receipts.length > 0;

    const isDelivered =
      status === "delivered" || status === "read" || receipts.length > 0;

    if (status === "failed") {
      return (
        <Text
          style={styles.failedText}
          accessibilityLabel="Échec de l'envoi"
          accessibilityRole="text"
        >
          !
        </Text>
      );
    }

    const label = hasBeenRead ? "Lu" : isDelivered ? "Distribué" : "Envoyé";

    return (
      <Text
        style={[styles.statusText, hasBeenRead && styles.statusTextRead]}
        accessibilityLabel={label}
        accessibilityRole="text"
      >
        {isDelivered ? "✓✓" : "✓"}
      </Text>
    );
  }

  if (status === "read") {
    return (
      <Text
        style={styles.readText}
        accessibilityLabel="Lu"
        accessibilityRole="text"
      >
        Lu
      </Text>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  markAsReadButton: {
    paddingVertical: 4,
  },

  markAsReadPressed: {
    opacity: 0.65,
  },

  markAsReadText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
  },

  failedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f87171",
  },

  statusText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
  },

  statusTextRead: {
    color: "#60a5fa",
  },

  readText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
  },
});

export default ReadReceipt;
