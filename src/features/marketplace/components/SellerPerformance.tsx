import { View, Text } from "react-native";

// src/features/marketplace/components/SellerPerformance.tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react-native";

interface Props {
  totalSales: number;
  totalRevenue: number;
  growth: number;
  responseRate: number;
  fulfillmentRate: number;
  currency: string;
}

export function SellerPerformance({
  totalSales,
  totalRevenue,
  growth,
  responseRate,
  fulfillmentRate,
  currency,
}: Props) {
  const metrics = [
    { label: "Ventes", value: totalSales.toLocaleString() },
    { label: "Revenu", value: `${totalRevenue.toLocaleString()} ${currency}` },
    { label: "Taux de réponse", value: `${responseRate}%` },
    { label: "Taux de livraison", value: `${fulfillmentRate}%` },
  ];

  return (
    <View className="space-y-3"><View className="flex items-center justify-between"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Performance
        </Text><View className="flex items-center gap-1 text-sm">{growth > 0 ? (
            <Text className="flex items-center gap-0.5 text-emerald-400"><TrendingUp size={14} />+{growth}%
            </Text>
          ) : growth < 0 ? (
            <Text className="flex items-center gap-0.5 text-red-400"><TrendingDown size={14} />{growth}%
            </Text>
          ) : (
            <Text className="text-white/40"><Minus size={14} />0%
            </Text>
          )}</View></View><View className="gap-2">{metrics.map((metric) => (
          <View key={metric.label} className="p-3 rounded-xl bg-white/5 border border-white/5">
            <Text className="text-white/40 text-[10px]">{metric.label}</Text>
            <Text className="text-white font-bold text-sm">{metric.value}</Text>
          </View>
        ))}</View></View>
  );
}
