import { Text, View, Pressable, Image } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface GroupHeaderProps {
  conversationId: Id<"conversations">;
  name?: string;
  avatar?: string | null;
  memberCount: number;
  onBack?: () => void;
}

export function GroupHeader({
  name = "Groupe",
  avatar,
  memberCount,
  onBack,
}: GroupHeaderProps) {
  return (
    <View className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
      {onBack && (
        <Pressable
          type="button"
          onPress={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          accessibilityLabel="Retour"
        >
          ←
        </Pressable>
      )}

      <View className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
        {avatar ? (
          <Image className="h-full w-full object-cover" source={{ uri: avatar }} accessibilityLabel={name} />
        ) : (
          <Text className="font-semibold text-white/70">
            {name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View className="min-w-0">
        <Text className="truncate text-sm font-semibold text-white">{name}</Text>

        <Text className="text-xs text-white/50">
          {memberCount} membre
          {memberCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

export default GroupHeader;
