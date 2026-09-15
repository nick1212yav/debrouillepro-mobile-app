import { View, Text } from "react-native";

interface RevenueChartProps {
  monthlyRevenues: Array<{ month: string; amount: number }>;
}

export function RevenueChart({ monthlyRevenues }: RevenueChartProps) {
  const maxAmount = Math.max(...monthlyRevenues.map((r) => r.amount), 1);

  return (
    <View className="p-5 rounded-3xl bg-white/[0.01] border border-white/[0.06] text-left space-y-4"><Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">Évolution du Chiffre d'Affaires
      </Text><View className="h-44 flex items-end gap-3 pt-6 relative">{monthlyRevenues.map((entry) => {
          const heightPercent = (entry.amount / maxAmount) * 100;
          return (
            <View key={entry.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              {/* Infobulle de valeur au survol */}
              <Text className="absolute -top-1 text-[9px] font-black text-orange-400 opacity-0 transition-opacity duration-300">
                {(entry.amount / 1000).toFixed(0)}k
              </Text>

              <View className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-lg transition-all duration-700" style={{ height: `${heightPercent}%` }} />

              <Text className="text-[10px] text-white/40 uppercase font-bold tracking-tight">
                {entry.month}
              </Text>
            </View>
          );
        })}</View></View>
  );
}
