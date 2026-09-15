import { View, Text } from "react-native";

export function ServiceStatistics({
  reviews,
  rating,
  responseTime,
}: {
  reviews: number;
  rating: number;
  responseTime: string;
}) {
  return (
    <View className="gap-3"><View className="p-3 rounded-xl bg-white/5 text-center"><Text className="text-orange-400 font-bold">{rating.toFixed(1)}</Text><Text className="text-white/40 text-xs">Note</Text></View><View className="p-3 rounded-xl bg-white/5 text-center"><Text className="text-white font-bold">{reviews}</Text><Text className="text-white/40 text-xs">Avis</Text></View><View className="p-3 rounded-xl bg-white/5 text-center"><Text className="text-white font-bold">{responseTime}</Text><Text className="text-white/40 text-xs">Réponse</Text></View></View>
  );
}
