import { Image, Text, View } from "react-native";

// src/features/profile/components/Avatar.tsx

interface AvatarProps {
  name?: string;
  avatar?: string;
  size?: number;
}

const DEFAULT_SIZE = 72;
const BORDER_WIDTH = 4;

function getInitials(name?: string): string {
  const normalizedName = name?.trim();

  if (!normalizedName) {
    return "?";
  }

  const parts = normalizedName.split(/\s+/).filter((part) => part.length > 0);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return normalizedName.slice(0, 2).toUpperCase();
}

export function Avatar({ name, avatar, size = DEFAULT_SIZE }: AvatarProps) {
  const safeSize = Number.isFinite(size) && size > 0 ? size : DEFAULT_SIZE;

  const initials = getInitials(name);
  const fontSize = Math.max(12, Math.round(safeSize * 0.3));

  if (avatar?.trim()) {
    return (
      <View
        className="overflow-hidden rounded-full border-4 border-[#020617]"
        style={{
          width: safeSize,
          height: safeSize,
        }}
      >
        <Image
          source={{ uri: avatar }}
          accessibilityLabel={name?.trim() || "Photo de profil"}
          resizeMode="cover"
          className="h-full w-full"
        />
      </View>
    );
  }

  return (
    <View
      className="items-center justify-center rounded-full border-4 border-[#020617] bg-white/10"
      style={{
        width: safeSize,
        height: safeSize,
      }}
      accessibilityLabel={
        name?.trim() ? `Avatar de ${name.trim()}` : "Avatar utilisateur"
      }
    >
      <Text
        className="font-black text-white"
        style={{
          fontSize,
          lineHeight: fontSize * 1.15,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
