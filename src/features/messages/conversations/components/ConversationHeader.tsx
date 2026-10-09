import { Image, Pressable, Text, View } from "react-native";
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
  conversationId,
  title,
  avatar,
  isGroup,
  memberCount,
  onBack,
  onInfo,
}: ConversationHeaderProps) {
  // Conservé dans le contrat public pour les appelants actuels.
  void conversationId;

  const displayTitle = title.trim() || "Conversation";
  const initial = displayTitle.charAt(0).toUpperCase() || "?";

  return (
    <View className="flex-row items-center gap-3 border-b border-white/10 px-4 py-3">
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
        >
          <Text className="text-xl leading-none text-white/80">‹</Text>
        </Pressable>
      ) : null}

      <View
        className="h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10"
        accessibilityLabel={`Avatar de ${displayTitle}`}
      >
        {avatar ? (
          <Image
            className="h-full w-full"
            source={{ uri: avatar }}
            resizeMode="cover"
            accessibilityLabel={`Photo de ${displayTitle}`}
          />
        ) : (
          <Text className="text-base font-semibold text-white/70">
            {initial}
          </Text>
        )}
      </View>

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-sm font-semibold text-white"
        >
          {displayTitle}
        </Text>

        {isGroup && memberCount !== undefined ? (
          <Text className="text-xs text-white/40">
            {memberCount} membre
            {memberCount !== 1 ? "s" : ""}
          </Text>
        ) : null}
      </View>

      {onInfo ? (
        <Pressable
          onPress={onInfo}
          accessibilityRole="button"
          accessibilityLabel="Informations"
          className="h-9 w-9 items-center justify-center rounded-full active:bg-white/10"
        >
          <Text className="text-lg text-white/70">ⓘ</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default ConversationHeader;
