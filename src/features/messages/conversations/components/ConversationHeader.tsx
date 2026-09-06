import { Pressable, Text, View, Image } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface ConversationHeaderProps {
  conversationId: Id<"conversations">;
  title: string;
  avatar?: string | null;
  isGroup: boolean;
  memberCount?: number;
  onBack?: () => void;
  onInfo?: () => void;
}

export function ConversationHeader({
  title,
  avatar,
  isGroup,
  memberCount,
  onBack,
  onInfo,
}: ConversationHeaderProps) {
  return (
    <View className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
      {onBack && (
        <Pressable
          onPress={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          accessibilityLabel="Retour"
        >
          ←
        </Pressable>
      )}

      <View className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
        {avatar ? (
          <Image
            className="h-full w-full object-cover" source={{ uri: avatar }} accessibilityLabel={title}
          />
        ) : (
          <Text className="font-semibold text-white/70">
            {title.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View className="min-w-0 flex-1">
        <Text className="truncate text-sm font-semibold text-white">{title}</Text>

        {isGroup && memberCount !== undefined && (
          <Text className="text-xs text-white/40">
            {memberCount} membre
            {memberCount !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {onInfo && (
        <Pressable
          onPress={onInfo}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70"
          accessibilityLabel="Informations"
        >
          ⓘ
        </Pressable>
      )}
    </View>
  );
}

export default ConversationHeader;
