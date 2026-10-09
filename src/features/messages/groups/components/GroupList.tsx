// src/features/messages/groups/components/GroupList.tsx

import { StyleSheet, Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

import type { GroupMember } from "../services/groups.service";
import { GroupItem } from "./GroupItem";

interface GroupListProps {
  conversationId: Id<"conversations">;
  members: GroupMember[];
  currentUserId?: Id<"users">;
  onMemberClick?: (member: GroupMember) => void;
}

export function GroupList({
  conversationId,
  members,
  currentUserId,
  onMemberClick,
}: GroupListProps) {
  // conversationId fait partie du contrat public du composant.
  void conversationId;

  if (members.length === 0) {
    return (
      <View
        style={styles.emptyContainer}
        accessibilityRole="text"
        accessibilityLabel="Aucun membre dans ce groupe"
      >
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>Aucun membre</Text>
        <Text style={styles.emptyText}>
          Ce groupe ne contient encore aucun membre.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="list"
      accessibilityLabel={`${members.length} membre${
        members.length !== 1 ? "s" : ""
      }`}
    >
      {members.map((member) => {
        const memberId = String(member.userId);

        return (
          <GroupItem
            key={memberId}
            member={member}
            isCurrentUser={member.userId === currentUserId}
            onClick={onMemberClick ? () => onMemberClick(member) : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 4,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  emptyIcon: {
    marginBottom: 10,
    fontSize: 28,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },

  emptyText: {
    marginTop: 4,
    maxWidth: 280,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
  },
});

export default GroupList;
