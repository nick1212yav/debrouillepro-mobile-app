import { View, Text } from "react-native";
// src/features/messages/chat/components/MessageReactions.tsx

import type { Id } from "@/convex/_generated/dataModel";

export interface MessageReaction {
  emoji: string;
  count: number;
}

interface MessageReactionsProps {
  messageId: Id<"messages">;
  reactions?: MessageReaction[];
  own?: boolean;
}

export function MessageReactions({
  reactions,
  own = false,
}: MessageReactionsProps) {
  if (!reactions || reactions.length === 0) {
    return null;
  }

  return (
    <View
      className={`mt-1 flex flex-wrap gap-1 ${
        own ? "justify-end" : "justify-start"
      }`}
      accessibilityLabel="Réactions au message"
    >
      {reactions.map((reaction) => (
        <Text
          key={`${reaction.emoji}-${reaction.count}`}
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] ${
            own ? "bg-black/10 text-black/80" : "bg-white/10 text-white/80"
          }`}
        >
          <Text>{reaction.emoji}</Text>

          {reaction.count > 1 && (
            <Text className="font-medium">{reaction.count}</Text>
          )}
        </Text>
      ))}
    </View>
  );
}

export default MessageReactions;
