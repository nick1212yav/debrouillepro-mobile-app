import { View, Text } from "react-native";
import { useEffect, useRef } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import type { Message } from "../services/chat.service";

import { MessageBubble } from "./MessageBubble";

interface MessagesAreaProps {
  messages: Message[];
  currentUserId: Id<"users">;
  isLoadingMore?: boolean;
  isDone?: boolean;
  onLoadMore?: (numItems?: number) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
}

export function MessagesArea({
  messages,
  currentUserId,
  isLoadingMore = false,
  isDone = false,
  onLoadMore,
  onReply,
  onForward,
}: MessagesAreaProps) {
  const containerRef = useRef<View | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      if (
        container.scrollTop <= 120 &&
        !isLoadingMore &&
        !isDone &&
        onLoadMore
      ) {
        onLoadMore(30);
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isLoadingMore, isDone, onLoadMore]);

  return (
    <View ref={containerRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{isLoadingMore && (
        <View className="mb-4 text-center text-xs text-white/30"><Text>Chargement des anciens messages...</Text></View>
      )}<View className="mx-auto flex max-w-3xl flex-col gap-2">{messages.map((message) => (
          <MessageBubble
            key={String(message._id)}
            message={message}
            currentUserId={currentUserId}
            onReply={onReply}
            onForward={onForward}
          />
        ))}{messages.length === 0 && (
          <View className="flex flex-1 items-center justify-center py-20 text-sm text-white/30">
            Aucun message.
          </View>
        )}</View></View>
  );
}

export default MessagesArea;
