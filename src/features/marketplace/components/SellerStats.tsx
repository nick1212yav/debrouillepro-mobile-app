import { Text, View } from "react-native";

// src/features/marketplace/components/SellerStats.tsx
import { Star, ShoppingBag, Clock, Zap } from "lucide-react-native";
import { formatCompactNumber } from "../utils/formatter";

interface Props {
  rating: number;
  reviewCount: number;
  totalSales: number;
  responseTime?: string;
  fulfillmentRate?: number;
}

export function SellerStats({
  rating,
  reviewCount,
  totalSales,
  responseTime,
  fulfillmentRate,
}: Props) {
  const stats = [
    {
      icon: Star,
      label: "Note",
      value: rating.toFixed(1),
      sub: `${reviewCount} avis`,
      color: "#F59E0B",
    },
    {
      icon: ShoppingBag,
      label: "Ventes",
      value: formatCompactNumber(totalSales),
      sub: "total",
      color: "#8B5CF6",
    },
    {
      icon: Clock,
      label: "Réponse",
      value: responseTime || "Rapide",
      sub: "moyenne",
      color: "#3B82F6",
    },
    {
      icon: Zap,
      label: "Taux de satisfaction",
      value: fulfillmentRate !== undefined ? `${fulfillmentRate}%` : "—",
      sub: "commandes",
      color: "#10B981",
    },
  ];

  return (
    <View className="gap-2">
      {stats.map((stat) => (
        <View key={stat.label} className="p-2 rounded-xl text-center bg-white/5 border border-white/5">
          <stat.icon
            size={14}
            style={{  }}
            className="mx-auto mb-0.5"
          />
          <Text className="text-white font-bold text-sm">{stat.value}</Text>
          <Text className="text-white/30 text-[9px]">{stat.sub}</Text>
        </View>
      ))}
    </View>
  );
}
