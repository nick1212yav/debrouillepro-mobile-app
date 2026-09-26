import { View, Text, Image, Pressable, StyleSheet } from "react-native";

// src/features/messages/groups/components/GroupItem.tsx

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
      <View style={styles.avatarWrapper}>
        {avatar ? (
          <Image
            style={styles.avatarImage}
            source={{ uri: avatar }}
            accessibilityLabel={name}
          />
        ) : (
          <Text style={styles.avatarInitial}>
            {name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {isCurrentUser && (
            <Text style={styles.selfLabel}>Vous</Text>
          )}
        </View>
        <Text style={styles.role}>{member.role ?? "member"}</Text>
      </View>
    </>
  );

  if (!onClick) {
    return (
      <View style={styles.row}>
        {content}
      </View>
    );
  }

  return (
    <Pressable onPress={onClick} style={styles.row}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.70)",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  selfLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
  },
  role: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
    textTransform: "capitalize",
  },
});

export default GroupItem;