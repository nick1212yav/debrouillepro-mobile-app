import { Text, Pressable } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { useReadReceipts } from "../hooks/useReadReceipts";

interface ReadReceiptProps {
  messageId: Id<"messages">;
  conversationId?: Id<"conversations">;
  senderId?: Id<"users">;
  currentUserId?: Id<"users">;
  status?: "sent" | "delivered" | "read" | "failed";
  className?: string;
  onRead?: (messageId: Id<"messages">) => void;
}

export function ReadReceipt({
  messageId,
  conversationId,
  senderId,
  currentUserId,
  status,
  className = "",
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
      // L'erreur est déjà journalisée par le hook.
    }
  };

  /*
   * Pour un message reçu, le composant peut être utilisé
   * directement pour déclencher la lecture.
   */
  if (!isOwnMessage && status !== "read") {
    return (
      <Pressable
        onPress={handleMarkAsRead}
        className={`text-xs text-white/40 transition hover:text-white/70 ${className}`}
        accessibilityLabel="Marquer comme lu"
      >
        Marquer comme lu
      </Pressable>
    );
  }

  /*
   * Pour un message envoyé par l'utilisateur :
   * - 1 coche : envoyé
   * - 2 coches : délivré
   * - 2 coches accentuées : lu
   */
  if (isOwnMessage) {
    const hasBeenRead = status === "read" || receipts.length > 0;

    const isDelivered =
      status === "delivered" || status === "read" || receipts.length > 0;

    if (status === "failed") {
      return (
        <Text
          className={`text-xs text-red-400 ${className}`}
          title="Échec de l'envoi"
          accessibilityLabel="Échec de l'envoi"
        >
          !
        </Text>
      );
    }

    return (
      <Text
        className={`inline-flex items-center text-xs ${hasBeenRead ? "text-blue-400" : "text-white/40"} ${className}`}
        title={hasBeenRead ? "Lu" : isDelivered ? "Délivré" : "Envoyé"}
        accessibilityLabel={hasBeenRead ? "Lu" : isDelivered ? "Délivré" : "Envoyé"}
      >
        {isDelivered ? "✓✓" : "✓"}
      </Text>
    );
  }

  /*
   * Message reçu déjà lu.
   */
  if (status === "read") {
    return (
      <Text className={`text-xs text-white/40 ${className}`} accessibilityLabel="Lu">
        Lu
      </Text>
    );
  }

  return null;
}

export default ReadReceipt;
