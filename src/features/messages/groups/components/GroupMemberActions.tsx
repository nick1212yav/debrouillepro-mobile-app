// src/features/messages/groups/components/GroupMemberActions.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";

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
      <View
        style={styles.unavailableContainer}
        accessibilityRole="text"
        accessibilityLabel="Aucune action de retrait disponible pour cet utilisateur"
      >
        <Text style={styles.unavailableText}>
          Aucune action de retrait disponible pour cet utilisateur.
        </Text>
      </View>
    );
  }

  const handleRemove = async () => {
    await removeMember(conversationId, member.userId);
    onRemoved?.();
  };

  return (
    <Pressable
      onPress={() => void handleRemove()}
      accessibilityRole="button"
      accessibilityLabel="Quitter le groupe"
      style={({ pressed }) => [
        styles.removeButton,
        pressed && styles.removeButtonPressed,
      ]}
    >
      <Text style={styles.removeButtonText}>Quitter le groupe</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  unavailableContainer: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  unavailableText: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.50)",
  },

  removeButton: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  removeButtonPressed: {
    backgroundColor: "rgba(239,68,68,0.18)",
  },

  removeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#f87171",
  },
});

export default GroupMemberActions;
