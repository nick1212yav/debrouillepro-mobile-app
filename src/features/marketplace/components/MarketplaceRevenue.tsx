import { View, Text } from "react-native";

// src/features/marketplace/components/MarketplaceRevenue.tsx
import { formatPrice } from "../utils/formatter";

interface Props {
  totalRevenue: number;
  monthlyRevenue: number;
  dailyRevenue: number;
  currency: string;
}

export function MarketplaceRevenue({
  totalRevenue,
  monthlyRevenue,
  dailyRevenue,
  currency,
}: Props) {
  return (
    <View className="p-4 rounded-2xl" style={{ borderWidth: 1, borderColor: "rgba(16,185,129,0.15)", borderStyle: "solid" }}><Text className="text-white/60 text-xs font-semibold uppercase tracking-wider">Revenu total
      </Text><Text className="text-white font-black text-2xl">{formatPrice(totalRevenue, currency)}</Text><View className="flex gap-4 mt-2 pt-2 border-t border-white/10"><View><Text className="text-white/40 text-[10px]">Ce mois</Text><Text className="text-white font-bold text-sm">{formatPrice(monthlyRevenue, currency)}</Text></View><View><Text className="text-white/40 text-[10px]">Aujourd'hui</Text><Text className="text-white font-bold text-sm">{formatPrice(dailyRevenue, currency)}</Text></View></View></View>
  );
}
