import { Text, Pressable, View } from "react-native";
import {
  Award,
  Star,
  Shield,
  Zap,
  Trophy,
  Crown,
  Sparkles,
} from "lucide-react-native";

interface Badge {
  id: string;
  name: string;
  icon: "award" | "star" | "shield" | "zap" | "trophy" | "crown" | "sparkles";
  color: string;
  description?: string;
  earnedAt?: number;
}

interface Props {
  badges: Badge[];
  size?: "sm" | "md" | "lg";
  onBadgeClick?: (badge: Badge) => void;
}

const ICON_MAP = {
  award: Award,
  star: Star,
  shield: Shield,
  zap: Zap,
  trophy: Trophy,
  crown: Crown,
  sparkles: Sparkles,
};

export function CommunityBadge({ badges, size = "md", onBadgeClick }: Props) {
  if (!badges || badges.length === 0) return null;

  const sizes = {
    sm: { icon: 12, container: "w-8 h-8", text: "text-[10px]" },
    md: { icon: 16, container: "w-10 h-10", text: "text-xs" },
    lg: { icon: 20, container: "w-14 h-14", text: "text-sm" },
  };

  const { icon, container, text } = sizes[size];

  return (
    <View className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = ICON_MAP[badge.icon] || Award;
        return (
          <Pressable
            key={badge.id}
            onPress={() => onBadgeClick?.(badge)}
            className={`flex items-center gap-1.5 ${container} rounded-xl transition-all hover:scale-110 cursor-pointer bg-white/5 border border-white/5`}
            style={{ borderColor: `${badge.color}30` }}
            title={badge.description || badge.name}
          >
            <Icon size={icon} style={{ color: badge.color }} />
            {size === "lg" && (
              <Text className={`${text} text-white/60 font-medium`}>
                {badge.name}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
