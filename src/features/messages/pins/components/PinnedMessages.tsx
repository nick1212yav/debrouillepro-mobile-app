import { View, Text, Pressable } from "react-native";
import { Pin, X } from "lucide-react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { usePinnedMessages } from "../hooks/usePinnedMessages";

import { PinnedMessageItem } from "./PinnedMessageItem";

interface PinnedMessagesProps {
  conversationId: Id<"conversations">;

  onClose?: () => void;

  onSelectMessage?: (messageId: Id<"messages">) => void;

  senderNames?: Record<string, string>;

  className?: string;
}

export function PinnedMessages({
  conversationId,
  onClose,
  onSelectMessage,
  senderNames,
  className = "",
}: PinnedMessagesProps) {
  const { pinnedMessages, isLoading, togglePin } =
    usePinnedMessages(conversationId);

  const handleUnpin = async (messageId: Id<"messages">) => {
    await togglePin(messageId);
  };

  return (
    <View className={[
        "flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827]",
        className,
      ].join(" ")}>{}<View className="flex items-center justify-between border-b border-white/10 px-4 py-3"><View className="flex items-center gap-3"><View className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10"><Pin size={17} className="rotate-[-35deg] text-violet-400" /></View><View><Text className="text-sm font-semibold text-white">Messages épinglés
            </Text><Text className="text-[11px] text-white/35">{isLoading
                ? "Chargement..."
                : `${pinnedMessages.length} ${
                    pinnedMessages.length > 1 ? "messages" : "message"
                  }`}</Text></View></View>{onClose && (
          <Pressable onPress={onClose} accessibilityLabel="Fermer" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition"><X size={17} /></Pressable>
        )}</View>{}<View className="max-h-[520px] overflow-y-auto p-3">{isLoading ? (
          <View className="space-y-2">{Array.from({
              length: 3,
            }).map((_, index) => (
              <View key={index} className="h-[76px] animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
            ))}</View>
        ) : pinnedMessages.length === 0 ? (
          <View className="flex flex-col items-center justify-center px-6 py-12 text-center"><View className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5"><Pin size={20} className="rotate-[-35deg] text-white/20" /></View><Text className="text-sm font-medium text-white/50">Aucun message épinglé
            </Text><Text className="mt-1 max-w-xs text-xs text-white/25">Les messages importants que tu épingles apparaîtront ici.
            </Text></View>
        ) : (
          <View className="space-y-2">
            {pinnedMessages.map((message) => (
              <PinnedMessageItem
                key={message._id}
                message={message}
                senderName={senderNames?.[message.senderId]}
                onUnpin={handleUnpin}
                onSelect={onSelectMessage}
              />
            ))}
          </View>
        )}</View></View>
  );
}

export default PinnedMessages;
