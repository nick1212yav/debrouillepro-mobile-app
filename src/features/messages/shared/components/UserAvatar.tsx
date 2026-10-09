// src/features/messages/shared/components/UserAvatar.tsx

import { Image, StyleSheet, Text, View } from "react-native";
import type { ViewProps } from "react-native";

export interface UserAvatarProps extends Omit<ViewProps, "children"> {
  name?: string | null;
  avatar?: string | null;
  size?: number;
  online?: boolean;
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
}

export function UserAvatar({
  name,
  avatar,
  size = 40,
  online = false,
  style,
  ...props
}: UserAvatarProps) {
  const safeSize = Math.max(1, size);
  const initials = getInitials(name);

  const fontSize = Math.max(11, Math.round(safeSize * 0.34));

  const onlineSize = Math.max(8, Math.round(safeSize * 0.24));

  const accessibilityLabel = name?.trim() || "Utilisateur";

  return (
    <View
      {...props}
      style={[
        styles.container,
        {
          width: safeSize,
          height: safeSize,
          minWidth: safeSize,
          borderRadius: safeSize / 2,
        },
        style,
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          resizeMode="cover"
          style={styles.image}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ) : (
        <Text
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.initials, { fontSize }]}
        >
          {initials}
        </Text>
      )}

      {online ? (
        <View
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            styles.onlineDot,
            {
              width: onlineSize,
              height: onlineSize,
              borderRadius: onlineSize / 2,
              borderWidth: Math.max(1, Math.round(safeSize * 0.05)),
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  initials: {
    fontWeight: "700",
    color: "#E2E8F0",
    textAlign: "center",
  },

  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    backgroundColor: "#22C55E",
    borderColor: "#020617",
  },
});

export default UserAvatar;
