import { View, Text } from "react-native";
export function RestaurantReviewStats() {
  const bars = [
    { stars: 5, pct: 85 },
    { stars: 4, pct: 10 },
    { stars: 3, pct: 3 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 },
  ];

  return (
    <View className="space-y-1.5 p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
      {bars.map((bar) => (
        <View key={bar.stars} className="flex items-center gap-3 text-xs">
          <Text className="w-4 text-white/50 text-right">{bar.stars} ★</Text>
          <View className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <View
              className="h-full bg-amber-400 rounded-full"
              style={{ width: `${bar.pct}%` }}
            />
          </View>
          <Text className="w-8 text-white/40 text-left">{bar.pct}<Text>%</Text></Text>
        </View>
      ))}
    </View>
  );
}
