// src/features/messages/groups/components/GroupHeader.tsx

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

interface GroupHeaderProps {
  conversationId: Id<"conversations">;
  name?: string;
  avatar?: string | null;
  memberCount: number;
  onBack?: () => void;
}

export function GroupHeader({
  conversationId: _conversationId,
  name = "Groupe",
  avatar,
  memberCount,
  onBack,
}: GroupHeaderProps) {
  const normalizedName = name.trim() || "Groupe";
  const initial = normalizedName.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
      ) : null}

      <View style={styles.avatar}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatarImage}
            accessibilityLabel={`Avatar de ${normalizedName}`}
          />
        ) : (
          <Text
            style={styles.avatarInitial}
            accessibilityLabel={`Initiale de ${normalizedName}`}
          >
            {initial}
          </Text>
        )}
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
          {normalizedName}
        </Text>

        <Text style={styles.memberCount}>
          {memberCount} membre{memberCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },

  backButton: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },

  backIcon: {
    marginTop: -3,
    fontSize: 30,
    fontWeight: "300",
    lineHeight: 34,
    color: "#ffffff",
  },

  avatar: {
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
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.70)",
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },

  memberCount: {
    marginTop: 2,
    fontSize: 12,
    color: "rgba(255,255,255,0.50)",
  },

  pressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
});

export default GroupHeader;
