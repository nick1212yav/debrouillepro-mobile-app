import { Text, View } from "react-native";

// src/features/marketplace/components/MarketplaceAnalytics.tsx
import { Eye, Users, Star, TrendingUp } from "lucide-react-native";
import { formatCompactNumber } from "../utils/formatter";

interface Props {
  views: number;
  visitors: number;
  conversionRate: number;
  averageRating: number;
}

export function MarketplaceAnalytics({
  views,
  visitors,
  conversionRate,
  averageRating,
}: Props) {
  const stats = [
    {
      icon: Eye,
      label: "Vues",
      value: formatCompactNumber(views),
      color: "#3B82F6",
    },
    {
      icon: Users,
      label: "Visiteurs",
      value: formatCompactNumber(visitors),
      color: "#8B5CF6",
    },
    {
      icon: TrendingUp,
      label: "Conversion",
      value: `${conversionRate}%`,
      color: "#10B981",
    },
    {
      icon: Star,
      label: "Note moyenne",
      value: averageRating.toFixed(1),
      color: "#F59E0B",
    },
  ];

  return (
    <View className="gap-2">
      {stats.map((stat) => (
        <View key={stat.label} className="p-3 rounded-xl text-center bg-white/5 border border-white/5">
          <stat.icon
            size={14}
            style={{  }}
            className="mx-auto mb-0.5"
          />
          <Text className="text-white font-bold text-sm">{stat.value}</Text>
          <Text className="text-white/30 text-[9px]">{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}
