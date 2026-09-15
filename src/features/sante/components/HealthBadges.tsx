import { Text, View } from "react-native";

// src/features/sante/components/HealthBadges.tsx
import { Shield, CheckCircle, Award, Star } from "lucide-react-native";

export interface Badge {
  id: string;
  label: string;
  icon: "verified" | "top" | "expert" | "recommended" | "emergency";
  color?: string;
}

interface HealthBadgesProps {
  badges: Badge[];
}

const iconMap = {
  verified: Shield,
  top: Award,
  expert: Star,
  recommended: CheckCircle,
  emergency: Award,
};

export function HealthBadges({ badges }: HealthBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <View className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = iconMap[badge.icon] || Shield;
        return (
          <Text key={badge.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/70" style={
              badge.color
                ? { borderColor: badge.color, color: badge.color }
                : {}
            }>
            <Icon size={12} />
            {badge.label}
          </Text>
        );
      })}
    </View>
  );
}
