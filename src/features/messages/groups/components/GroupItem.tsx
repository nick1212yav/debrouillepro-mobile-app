// src/features/messages/groups/components/GroupItem.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

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
  const initial = name.charAt(0).toUpperCase();
  const role = member.role?.trim() || "member";

  const content = (
    <>
      <View style={styles.avatarWrapper}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatarImage}
            accessibilityLabel={name}
          />
        ) : (
          <Text style={styles.avatarInitial}>{initial}</Text>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>

          {isCurrentUser ? (
            <View style={styles.selfBadge}>
              <Text style={styles.selfLabel}>Vous</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.role} numberOfLines={1}>
          {role}
        </Text>
      </View>
    </>
  );

  if (!onClick) {
    return (
      <View
        style={styles.row}
        accessibilityRole="text"
        accessibilityLabel={`${name}, ${role}${isCurrentUser ? ", vous" : ""}`}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onClick}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${name}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  avatarWrapper: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    fontSize: 14,
    fontWeight: "700",
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
    minWidth: 0,
  },

  name: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },

  selfBadge: {
    flexShrink: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.12)",
  },

  selfLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#c4b5fd",
  },

  role: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
    textTransform: "capitalize",
  },
});

export default GroupItem;
