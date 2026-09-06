import { View, Image } from "react-native";

// src/features/profile/components/Avatar.tsx

interface AvatarProps {
  name?: string;
  avatar?: string;
  size?: number;
}

export function Avatar({ name, avatar, size = 72 }: AvatarProps) {
  if (avatar) {
    return (
      <Image
        className="rounded-full object-cover border-4 border-[#020617]"
        style={{ width: size, height: size }} source={{ uri: avatar }} accessibilityLabel={name ?? "?"}
      />
    );
  }
  const initials = name ? name.slice(0, 2).toUpperCase() : "?";
  return (
    <View
      className="rounded-full flex items-center justify-center font-black text-white border-4 border-[#020617]"
      style={{ width: size, height: size }}
    >
      {initials}
    </View>
  );
}
