import { View, Text, Image } from "react-native";
import type { CurrentUser } from "@/hooks/use-current-user.ts";
import { getInitials } from "@/hooks/use-current-user.ts";
import { cn } from "@/lib/utils.ts";

interface UserAvatarProps {
  user: CurrentUser | null | undefined;
  /** Tailwind size classes applied to the wrapper, e.g. "w-10 h-10" */
  size?: string;
  /** Extra classes for the wrapper div */
  className?: string;
  /** Whether to show the online status dot */
  showOnline?: boolean;
}

const GRADIENT_COLORS = [
  "from-violet-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-teal-500 to-emerald-600",
  "from-orange-500 to-amber-600",
  "from-cyan-500 to-blue-600",
];

function pickGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

export default function UserAvatar({
  user,
  size = "w-10 h-10",
  className,
  showOnline,
}: UserAvatarProps) {
  const initials = getInitials(user);
  const gradient = pickGradient(user?._id ?? "default");

  return (
    <View className={cn("relative flex-shrink-0", size, className)}>
      {user?.avatar ? (
        <Image
          className="w-full h-full rounded-2xl"
          source={{ uri: user.avatar }}
          accessibilityLabel={initials}
        />
      ) : (
        <View
          className={cn(
            "w-full h-full rounded-2xl items-center justify-center",
            `bg-gradient-to-br ${gradient}`,
          )}
        >
          {/* ✅ Texte dans <Text>, taille contrôlée par className */}
          <Text className="text-base font-black text-white">{initials}</Text>
        </View>
      )}

      {/* ✅ Pastille = View, pas Text */}
      {showOnline && (
        <View className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-background" />
      )}
    </View>
  );
}
