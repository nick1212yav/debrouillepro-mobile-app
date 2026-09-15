import { View, Image, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileAvatar.tsx
import { Check, Camera } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileAvatarProps {
  name?: string;
  avatar?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  verified?: boolean;
  editable?: boolean;
  onEdit?: () => void;
  className?: string;
  isLoading?: boolean;
}

const SIZE_MAP = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
  xxl: 120,
};

const BORDER_SIZE = {
  sm: 2,
  md: 3,
  lg: 3,
  xl: 4,
  xxl: 4,
};

const BADGE_SIZE = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
};

export function ProfileAvatar({
  name,
  avatar,
  size = "lg",
  verified = false,
  editable = false,
  onEdit,
  className,
  isLoading = false,
}: ProfileAvatarProps) {
  const pixelSize = SIZE_MAP[size];
  const borderSize = BORDER_SIZE[size];
  const badgeSize = BADGE_SIZE[size];
  const fontSize = pixelSize * 0.35;

  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "?";

  if (isLoading) {
    return (
      <View className={cn("rounded-full flex-shrink-0", className)} style={{ width: pixelSize, height: pixelSize }}><Skeleton className="w-full h-full rounded-full" /></View>
    );
  }

  return (
    <View className={cn("relative flex-shrink-0", className)}><View className="relative rounded-full overflow-hidden" style={{ width: pixelSize, height: pixelSize, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{avatar ? (
          <Image className="w-full h-full object-cover" source={{ uri: avatar }} accessibilityLabel={name ?? "Avatar"} />
        ) : (
          <View className="w-full h-full flex items-center justify-center text-white font-bold" style={{ fontSize }}>
            {initials}
          </View>
        )}{editable && (
          <Pressable onPress={onEdit} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity">
            <Camera size={pixelSize * 0.3} className="text-white" />
          </Pressable>
        )}</View>{verified && (
        <View className="absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#020617]" style={{
            width: badgeSize,
            height: badgeSize,
          }}>
          <Check
            size={badgeSize * 0.55}
            className="text-white"
            strokeWidth={3}
          />
        </View>
      )}</View>
  );
}
