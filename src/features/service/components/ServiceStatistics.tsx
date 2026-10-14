import { Text, View } from "react-native";

interface Props {
  reviews: number;
  rating: number;
  responseTime: string;
}

export function ServiceStatistics({ reviews, rating, responseTime }: Props) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const safeReviews = Number.isFinite(reviews)
    ? Math.max(0, Math.floor(reviews))
    : 0;
  const safeResponseTime = (responseTime ?? "").trim() || "Non précisé";

  return (
    <View className="flex-row gap-3">
      <View className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3">
        <Text className="font-bold text-orange-400">
          {safeRating.toFixed(1)}
        </Text>
        <Text className="mt-1 text-xs text-white/40">Note</Text>
      </View>

      <View className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3">
        <Text className="font-bold text-white">{safeReviews}</Text>
        <Text className="mt-1 text-xs text-white/40">Avis</Text>
      </View>

      <View className="flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3">
        <Text className="text-center font-bold text-white" numberOfLines={2}>
          {safeResponseTime}
        </Text>
        <Text className="mt-1 text-center text-xs text-white/40">Réponse</Text>
      </View>
    </View>
  );
}
