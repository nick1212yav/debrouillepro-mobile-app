import { Text, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

// src/features/messages/chat/components/MessageReactions.tsx

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
      className={[
        "mt-1 w-full flex-row flex-wrap gap-1",
        own ? "justify-end" : "justify-start",
      ].join(" ")}
      accessibilityRole="text"
      accessibilityLabel="Réactions au message"
    >
      {reactions.map((reaction, index) => {
        const count = Math.max(0, Math.floor(reaction.count));

        return (
          <View
            key={`${reaction.emoji}-${index}`}
            className={[
              "min-h-[22px] flex-row items-center rounded-full px-2 py-0.5",
              own ? "bg-black/10" : "border border-white/[0.06] bg-white/10",
            ].join(" ")}
            accessibilityLabel={
              count > 1
                ? `${reaction.emoji}, ${count} réactions`
                : `${reaction.emoji}, 1 réaction`
            }
          >
            <Text
              className={[
                "text-[12px] leading-4",
                own ? "text-black/85" : "text-white/90",
              ].join(" ")}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              {reaction.emoji}
            </Text>

            {count > 1 && (
              <Text
                className={[
                  "ml-1 text-[10px] font-semibold leading-4",
                  own ? "text-black/60" : "text-white/55",
                ].join(" ")}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {count}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default MessageReactions;
