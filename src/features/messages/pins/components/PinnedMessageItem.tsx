// src/features/messages/pins/components/PinnedMessageItem.tsx

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
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

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
  if (!Number.isFinite(timestamp)) {
    return "";
  }

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

  if (type === "voice") {
    return "Message vocal";
  }

  if (type === "image") {
    return "Photo";
  }

  if (type === "video") {
    return "Vidéo";
  }

  if (type === "file") {
    return "Fichier";
  }

  if (type === "publication" || message.sharedPublicationId) {
    return "Publication partagée";
  }

  if (message.attachmentIds?.length) {
    return "Pièce jointe";
  }

  if (message.text?.trim()) {
    return message.text.trim();
  }

  return "Message";
}

function getMessageIcon(message: PinnedMessageItemProps["message"]) {
  switch (message.type) {
    case "voice":
      return <Mic size={15} color="rgba(255,255,255,0.55)" />;

    case "image":
      return <ImageIcon size={15} color="rgba(255,255,255,0.55)" />;

    case "video":
      return <Video size={15} color="rgba(255,255,255,0.55)" />;

    case "file":
      return <FileText size={15} color="rgba(255,255,255,0.55)" />;

    case "publication":
      return <Play size={15} color="rgba(255,255,255,0.55)" />;

    default:
      return null;
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
  const canSelect = Boolean(onSelect);
  const canUnpin = Boolean(onUnpin);

  const handleSelect = () => {
    if (!onSelect) {
      return;
    }

    onSelect(message._id);
  };

  const handleUnpin = async () => {
    if (!onUnpin || isUnpinning) {
      return;
    }

    await onUnpin(message._id);
  };

  const displaySenderName = senderName?.trim() || "Utilisateur";

  return (
    <View style={styles.container}>
      <View
        style={styles.iconWrapper}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        <Pin size={16} color="#a78bfa" />
      </View>

      <Pressable
        onPress={canSelect ? handleSelect : undefined}
        disabled={!canSelect}
        accessibilityRole={canSelect ? "button" : undefined}
        accessibilityLabel={
          canSelect
            ? `Ouvrir le message épinglé de ${displaySenderName}`
            : `Message épinglé de ${displaySenderName}`
        }
        accessibilityHint={
          canSelect ? "Ouvre la conversation sur ce message." : undefined
        }
        style={({ pressed }) => [
          styles.body,
          canSelect && pressed && styles.bodyPressed,
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.senderName} numberOfLines={1}>
            {displaySenderName}
          </Text>

          <Text style={styles.date} numberOfLines={1}>
            {formatMessageDate(message._creationTime)}
          </Text>
        </View>

        <View style={styles.previewRow}>
          {icon ? (
            <View
              style={styles.previewIcon}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {icon}
            </View>
          ) : null}

          <Text style={styles.previewText} numberOfLines={1}>
            {preview}
          </Text>
        </View>

        {message.replyToId ? (
          <View style={styles.replyRow}>
            <Reply
              size={11}
              color="rgba(255,255,255,0.25)"
              accessibilityElementsHidden
            />

            <Text style={styles.replyText}>Réponse à un message</Text>
          </View>
        ) : null}
      </Pressable>

      {canUnpin ? (
        <Pressable
          onPress={handleUnpin}
          disabled={isUnpinning}
          accessibilityRole="button"
          accessibilityLabel={
            isUnpinning ? "Désépinglage en cours" : "Désépingler le message"
          }
          accessibilityState={{
            disabled: isUnpinning,
            busy: isUnpinning,
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.unpinButton,
            pressed && !isUnpinning && styles.unpinButtonPressed,
          ]}
        >
          {isUnpinning ? (
            <Text
              style={styles.unpinSpinner}
              accessibilityLabel="Désépinglage en cours"
            >
              ...
            </Text>
          ) : (
            <X size={15} color="rgba(255,255,255,0.45)" />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
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
    borderRadius: 10,
  },

  bodyPressed: {
    opacity: 0.7,
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
    maxWidth: 130,
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
    alignItems: "center",
    justifyContent: "center",
  },

  previewText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 20,
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
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderRadius: 8,
  },

  unpinButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  unpinSpinner: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
  },
});

export default PinnedMessageItem;
