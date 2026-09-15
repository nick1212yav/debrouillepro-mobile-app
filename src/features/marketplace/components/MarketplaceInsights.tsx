import { View, Text } from "react-native";

// src/features/marketplace/components/MarketplaceInsights.tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react-native";

interface Insight {
  label: string;
  value: number;
  change: number;
  unit?: string;
}

interface Props {
  insights: Insight[];
}

export function MarketplaceInsights({ insights }: Props) {
  return (
    <View className="space-y-2"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">Insights
      </Text>{insights.map((insight) => (
        <View key={insight.label} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"><Text className="text-white/70 text-sm">{insight.label}</Text><View className="flex items-center gap-2"><Text className="text-white font-bold text-sm">{insight.value}{insight.unit ? ` ${insight.unit}` : ""}</Text>{insight.change > 0 ? (
              <Text className="flex items-center gap-0.5 text-emerald-400 text-xs">
                <TrendingUp size={12} /> +{insight.change}%
              </Text>
            ) : insight.change < 0 ? (
              <Text className="flex items-center gap-0.5 text-red-400 text-xs">
                <TrendingDown size={12} /> {insight.change}%
              </Text>
            ) : (
              <Text className="text-white/30 text-xs">
                <Minus size={12} /> 0%
              </Text>
            )}</View></View>
      ))}</View>
  );
}
