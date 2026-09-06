import { View, Text, Pressable, Image } from "react-native";
import type { ConversationPreview } from "../services/conversations.service";

interface ConversationItemProps {
  conversation: ConversationPreview;
  active?: boolean;
  onClick?: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ConversationItem({
  conversation,
  active = false,
  onClick,
}: ConversationItemProps) {
  const title = conversation.title || "Conversation";

  return (
    <Pressable
     
      onPress={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
        active ? "bg-white/10" : "hover:bg-white/5"
      }`}
    >
      <View className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
        {conversation.avatar ? (
          <Image
           
           
            className="h-full w-full object-cover"
           source={{ uri: conversation.avatar }} accessibilityLabel={title}/>
        ) : (
          <Text className="font-semibold text-white/70">
            {title.charAt(0).toUpperCase()}
          </Text>
        )}

        {conversation.isGroup && (
          <Text className="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[9px]">
            👥
          </Text>
        )}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex items-center gap-2">
          <Text className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
            {title}
          </Text>

          <Text className="shrink-0 text-[11px] text-white/40">
            {formatDate(conversation.updatedAt)}
          </Text>
        </View>

        <View className="mt-1 flex items-center gap-2">
          <Text className="min-w-0 flex-1 truncate text-xs text-white/50">
            {conversation.lastMessageText || "Aucun message"}
          </Text>

          {conversation.unreadCount > 0 && (
            <Text className="flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-black">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default ConversationItem;
