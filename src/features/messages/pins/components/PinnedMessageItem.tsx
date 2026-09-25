import { View, Text, Pressable, StyleSheet } from "react-native";
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Pin,
  Play,
  Reply,
  Video,
  X,
} from "lucide-react-native";

import type { Id } from "@/convex/_generated/dataModel";

// src/features/messages/pins/components/PinnedMessageItem.tsx

interface PinnedMessageItemProps {
  message: {
    _id: Id<"messages">;
    _creationTime: number;
    text: string;
    senderId: Id<"users">;
    isPinned?: boolean;
    type?: string;
    voiceDuration?: number;
    attachmentIds?: Id<"_storage">[];
    replyToId?: Id<"messages">;
    sharedPublicationId?: Id<"publications">;
  };
  senderName?: string;
  onUnpin?: (messageId: Id<"messages">) => void | Promise<void>;
  onSelect?: (messageId: Id<"messages">) => void;
  isUnpinning?: boolean;
}

function formatMessageDate(timestamp: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getMessagePreview(message: PinnedMessageItemProps["message"]): string {
  const type = message.type;
  if (type === "voice") return "Message vocal";
  if (type === "image") return "Photo";
  if (type === "video") return "Vidéo";
  if (type === "file") return "Fichier";
  if (type === "publication" || message.sharedPublicationId) return "Publication partagée";
  if (message.attachmentIds?.length) return "Pièce jointe";
  if (message.text?.trim()) return message.text;
  return "Message";
}

function getMessageIcon(message: PinnedMessageItemProps["message"]) {
  switch (message.type) {
    case "voice": return <Mic size={15} />;
    case "image": return <ImageIcon size={15} />;
    case "video": return <Video size={15} />;
    case "file": return <FileText size={15} />;
    case "publication": return <Play size={15} />;
    default: return null;
  }
}

export function PinnedMessageItem({
  message,
  senderName,
  onUnpin,
  onSelect,
  isUnpinning = false,
}: PinnedMessageItemProps) {
  const preview = getMessagePreview(message);
  const icon = getMessageIcon(message);

  const handleSelect = () => {
    onSelect?.(message._id);
  };

  const handleUnpin = async () => {
    if (isUnpinning) return;
    await onUnpin?.(message._id);
  };

  return (
    <Pressable
      onPress={onSelect ? handleSelect : undefined}
      disabled={!onSelect}
      accessibilityRole={onSelect ? "button" : undefined}
      style={styles.container}
    >
      <View style={styles.iconWrapper}>
        <Pin size={16} color="#a78bfa" />
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.senderName} numberOfLines={1}>
            {senderName ?? "Utilisateur"}
          </Text>
          <Text style={styles.date}>
            {formatMessageDate(message._creationTime)}
          </Text>
        </View>

        <View style={styles.previewRow}>
          {icon && <View style={styles.previewIcon}>{icon}</View>}
          <Text style={styles.previewText} numberOfLines={1}>
            {preview}
          </Text>
        </View>

        {message.replyToId && (
          <View style={styles.replyRow}>
            <Reply size={11} color="rgba(255,255,255,0.25)" />
            <Text style={styles.replyText}>Réponse à un message</Text>
          </View>
        )}
      </View>

      {onUnpin && (
        <Pressable
          onPress={handleUnpin}
          disabled={isUnpinning}
          accessibilityLabel="Désépingler le message"
          style={styles.unpinButton}
        >
          {isUnpinning ? (
            <Text style={styles.unpinSpinner}>...</Text>
          ) : (
            <X size={15} color="rgba(255,255,255,0.4)" />
          )}
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.10)",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  senderName: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.80)",
  },
  date: {
    flexShrink: 0,
    fontSize: 10,
    color: "rgba(255,255,255,0.30)",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  previewIcon: {
    flexShrink: 0,
  },
  previewText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: "rgba(255,255,255,0.60)",
  },
  replyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  replyText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
  },
  unpinButton: {
    width: 32,
    height: 32,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  unpinSpinner: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
});

export default PinnedMessageItem;