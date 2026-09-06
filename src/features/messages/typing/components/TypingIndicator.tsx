import { View, Text, Image } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { useTyping } from "../hooks/useTyping";

interface TypingIndicatorProps {
  conversationId?: Id<"conversations">;
  className?: string;
}

export function TypingIndicator({
  conversationId,
  className = "",
}: TypingIndicatorProps) {
  const { typingUsers, isSomeoneTyping, typingText } =
    useTyping(conversationId);

  if (!isSomeoneTyping) {
    return null;
  }

  return (
    <View
      className={`flex items-center gap-2 px-4 py-2 ${className}`}
     
      accessibilityLabel={typingText}
     accessibilityLiveRegion="polite">
      <View className="flex items-center gap-1 rounded-full bg-white/[0.06] px-3 py-2">
        <Text className="flex items-center gap-1">
          <Text className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:-0.3s]" />
          <Text className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45 [animation-delay:-0.15s]" />
          <Text className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/45" />
        </Text>

        <Text className="ml-1 text-xs text-white/45">{typingText}</Text>
      </View>

      {typingUsers.length > 0 && (
        <View className="flex -space-x-2">
          {typingUsers.slice(0, 3).map((user) => (
            <View
              key={user.userId}
              className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-[#0b1120] bg-white/10"
              title={user.name}
            >
              {user.image ? (
                <Image
                 
                 
                  className="h-full w-full object-cover"
                 source={{ uri: user.image }} accessibilityLabel={user.name}/>
              ) : (
                <Text className="text-[10px] font-semibold text-white/50">
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default TypingIndicator;
