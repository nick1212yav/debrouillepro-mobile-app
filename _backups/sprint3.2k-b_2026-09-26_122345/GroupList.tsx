import { View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { GroupItem } from "./GroupItem";

import type { GroupMember } from "../services/groups.service";

interface GroupListProps {
  conversationId: Id<"conversations">;
  members: GroupMember[];
  currentUserId?: Id<"users">;
  onMemberClick?: (member: GroupMember) => void;
}

export function GroupList({
  members,
  currentUserId,
  onMemberClick,
}: GroupListProps) {
  if (members.length === 0) {
    return (
      <View className="p-4 text-center text-sm text-white/50">Aucun membre.</View>
    );
  }

  return (
    <View className="space-y-1">
      {members.map((member) => (
        <GroupItem
          key={String(member.userId)}
          member={member}
          isCurrentUser={member.userId === currentUserId}
          onPress={() => onMemberClick?.(member)}
        />
      ))}
    </View>
  );
}

export default GroupList;
