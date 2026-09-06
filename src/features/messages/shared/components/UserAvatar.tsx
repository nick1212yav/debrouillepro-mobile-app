import { Text, View, Image, ViewProps, ViewStyle, TextStyle, ImageStyle } from "react-native";

// src/features/messages/shared/components/UserAvatar.tsx

export interface UserAvatarProps extends Omit<
  ViewProps,
  "children"
> {
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

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function UserAvatar({
  name,
  avatar,
  size = 40,
  online = false,
  className = "",
  style,
  ...props
}: UserAvatarProps) {
  const initials = getInitials(name);

  const containerStyle: ViewStyle | TextStyle | ImageStyle = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: "50%",
    overflow: "hidden",
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "var(--messages-avatar-bg, #e5e7eb)",
    color: "var(--messages-avatar-color, #374151)",
    fontSize: Math.max(11, Math.round(size * 0.34)),
    fontWeight: 600,
    userSelect: "none",
    ...style,
  };

  return (
    <View
      {...props}
      className={className}
      style={containerStyle}
      accessibilityLabel={name ?? "Utilisateur"}
    >
      {avatar ? (
        <Image
          style={{ width: "100%", height: "100%", display: "block" }} source={{ uri: avatar }} accessibilityLabel={name ?? "Utilisateur"}
        />
      ) : (
        <Text accessibilityElementsHidden={true}>{initials}</Text>
      )}

      {online && (
        <Text
          accessibilityLabel="En ligne"
          style={{ position: "absolute", right: 1, bottom: 1, width: Math.max(8, Math.round(size * 0.24)), height: Math.max(8, Math.round(size * 0.24)), borderRadius: "50%", backgroundColor: "#22c55e", borderColor: "#fff", borderStyle: "solid" }}
        />
      )}
    </View>
  );
}

export default UserAvatar;
