import { Pressable, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { useGroupActions } from "../hooks/useGroupActions";

import type { GroupMember } from "../services/groups.service";

interface GroupMemberActionsProps {
  conversationId: Id<"conversations">;
  member: GroupMember;
  currentUserId: Id<"users">;
  onRemoved?: () => void;
}

export function GroupMemberActions({
  conversationId,
  member,
  currentUserId,
  onRemoved,
}: GroupMemberActionsProps) {
  const { removeMember } = useGroupActions();

  const isCurrentUser = member.userId === currentUserId;

  if (!isCurrentUser) {
    return (
      <View className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
        Aucune action de retrait disponible pour cet utilisateur.
      </View>
    );
  }

  const handleRemove = async () => {
    await removeMember(conversationId, member.userId);

    onRemoved?.();
  };

  return (
    <Pressable
      type="button"
      onPress={handleRemove}
      className="w-full rounded-xl bg-red-500/10 px-4 py-3 text-left text-sm text-red-400"
    >
      Quitter le groupe
    </Pressable>
  );
}

export default GroupMemberActions;
