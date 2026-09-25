import { Text, View, Image, StyleSheet } from "react-native";
import type { ViewProps } from "react-native";

// src/features/messages/shared/components/UserAvatar.tsx

export interface UserAvatarProps extends Omit<ViewProps, "children"> {
  name?: string | null;
  avatar?: string | null;
  size?: number;
  online?: boolean;
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function UserAvatar({
  name,
  avatar,
  size = 40,
  online = false,
  style,
  ...props
}: UserAvatarProps) {
  const initials = getInitials(name);
  const fontSize = Math.max(11, Math.round(size * 0.34));
  const onlineSize = Math.max(8, Math.round(size * 0.24));

  return (
    <View
      {...props}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          minWidth: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      accessibilityLabel={name ?? "Utilisateur"}
    >
      {avatar ? (
        <Image
          style={styles.image}
          source={{ uri: avatar }}
          accessibilityLabel={name ?? "Utilisateur"}
        />
      ) : (
        <Text
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          style={[styles.initials, { fontSize }]}
        >
          {initials}
        </Text>
      )}

      {online && (
        <View
          accessibilityLabel="En ligne"
          style={[
            styles.onlineDot,
            {
              width: onlineSize,
              height: onlineSize,
              borderRadius: onlineSize / 2,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    fontWeight: "600",
    color: "#374151",
  },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 1,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
});

export default UserAvatar;