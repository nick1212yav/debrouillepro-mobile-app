import { View, Text, Image } from "react-native";
import type { GroupMember } from "../services/groups.service";

interface GroupItemProps {
  member: GroupMember;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

export function GroupItem({
  member,
  isCurrentUser = false,
  onClick,
}: GroupItemProps) {
  const name = member.user?.name?.trim() || "Utilisateur";

  const avatar = member.user?.avatar;

  const content = (
    <>
      <View className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
        {avatar ? (
          <Image className="h-full w-full object-cover"  source={{ uri: avatar }} accessibilityLabel={name}/>
        ) : (
          <Text className="text-sm font-semibold text-white/70">
            {name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex items-center gap-2">
          <Text className="truncate text-sm font-medium text-white">{name}</Text>

          {isCurrentUser && <Text className="text-xs text-white/40"><Text>Vous</Text></Text>}
        </View>

        <Text className="text-xs capitalize text-white/40">
          {member.role ?? "member"}
        </Text>
      </View>
    </>
  );

  if (!onClick) {
    return (
      <View className="flex items-center gap-3 rounded-xl px-3 py-2">
        {content}
      </View>
    );
  }

  return (
    <Pressable
      type="button"
      onPress={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left"
    >
      {content}
    </Pressable>
  );
}

export default GroupItem;
