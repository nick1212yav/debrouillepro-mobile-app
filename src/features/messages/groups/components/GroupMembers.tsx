import { View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { useGroups } from "../hooks/useGroups";

import { GroupList } from "./GroupList";

interface GroupMembersProps {
  conversationId: Id<"conversations">;
  currentUserId?: Id<"users">;
}

export function GroupMembers({
  conversationId,
  currentUserId,
}: GroupMembersProps) {
  const { members, isLoading } = useGroups(conversationId);

  if (isLoading) {
    return (
      <View className="p-4 text-sm text-white/50">Chargement des membres...</View>
    );
  }

  return (
    <GroupList
      conversationId={conversationId}
      members={members}
      currentUserId={currentUserId}
    />
  );
}

export default GroupMembers;
