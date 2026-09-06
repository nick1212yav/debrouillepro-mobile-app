import { View, Text, GestureResponderEvent, Pressable } from "react-native";
import {
  FileText,
  Image as ImageIcon,
  MapPin,
  Mic,
  Pin,
  Play,
  Reply,
  Video,
  X,
} from "lucide-react-native";

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

function formatMessageDate(timestamp: number) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getMessagePreview(message: PinnedMessageItemProps["message"]) {
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
    return message.text;
  }

  return "Message";
}

function getMessageIcon(message: PinnedMessageItemProps["message"]) {
  switch (message.type) {
    case "voice":
      return <Mic size={15} />;

    case "image":
      return <ImageIcon size={15} />;

    case "video":
      return <Video size={15} />;

    case "file":
      return <FileText size={15} />;

    case "publication":
      return <Play size={15} />;

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

  const handleSelect = () => {
    onSelect?.(message._id);
  };

  const handleUnpin = async (event: GestureResponderEvent) => {
    if (isUnpinning) {
      return;
    }

    await onUnpin?.(message._id);
  };

  return (
    <Pressable
      className="group relative flex w-full gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3"
      onPress={handleSelect}
      accessibilityRole={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(event) => {
        if (onSelect && (event.key === "Enter" || event.key === " ")) {
          handleSelect();
        }
      }}
    >
      {/* Icône épingle */}
      <View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
        <Pin size={16} className="text-violet-400" />
      </View>

      {/* Contenu */}
      <View className="min-w-0 flex-1">
        <View className="mb-1 flex items-center gap-2">
          <Text className="truncate text-xs font-semibold text-white/80">
            {senderName ?? "Utilisateur"}
          </Text>

          <Text className="shrink-0 text-[10px] text-white/30">
            {formatMessageDate(message._creationTime)}
          </Text>
        </View>

        <View className="flex min-w-0 items-center gap-2">
          {icon && <Text className="shrink-0 text-violet-400/70">{icon}</Text>}

          <Text className="min-w-0 text-sm text-white/60">
            {preview}
          </Text>
        </View>

        {message.replyToId && (
          <View className="mt-1 flex items-center gap-1 text-[10px] text-white/25">
            <Reply size={11} />
            <Text>Réponse à un message</Text></View>
        )}
      </View>

      {/* Désépingler */}
      {onUnpin && (
        <Pressable
          type="button"
          onPress={handleUnpin}
          disabled={isUnpinning}
          accessibilityLabel="Désépingler le message"
          title="Désépingler"
          className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg text-white/25 opacity-0 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUnpinning ? (
            <Text className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          ) : (
            <X size={15} />
          )}
        </Pressable>
      )}
    </Pressable>
  );
}

export default PinnedMessageItem;
