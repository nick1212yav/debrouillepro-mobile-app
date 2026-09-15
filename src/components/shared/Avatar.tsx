import { View, Image } from "react-native";

interface Props {
  name: string;
  avatar?: string | null;
  size?: number;
  online?: boolean;
}

export function Avatar({ name, avatar, size = 48, online }: Props) {
  const colors = [
    "#7C3AED",
    "#6366F1",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#EC4899",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <View className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {avatar ? (
        <Image className="object-cover rounded-full" style={{ width: size, height: size }} source={{ uri: avatar }} accessibilityLabel={name} />
      ) : (
        <View className="rounded-full flex items-center justify-center text-white font-bold" style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}>
          {name.charAt(0).toUpperCase()}
        </View>
      )}
      {online && (
        <View className="absolute bottom-0 right-0 rounded-full border-2 border-[#111827]" style={{ width: size * 0.28, height: size * 0.28, backgroundColor: "#22c55e" }} />
      )}
    </View>
  );
}
