// src/features/messages/groups/components/GroupMembers.tsx

import { StyleSheet, Text, View } from "react-native";

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
      <View
        style={styles.loadingContainer}
        accessibilityRole="progressbar"
        accessibilityLabel="Chargement des membres"
      >
        <Text style={styles.loadingText}>Chargement des membres...</Text>
      </View>
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

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },

  loadingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.50)",
  },
});

export default GroupMembers;
