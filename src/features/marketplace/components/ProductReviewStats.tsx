import { View, Text } from "react-native";
// src/features/marketplace/components/ProductReviewStats.tsx
import { Star } from "lucide-react-native";

interface Props {
  ratings: Record<number, number>; // rating 1-5 -> count
  totalReviews: number;
}

export function ProductReviewStats({ ratings, totalReviews }: Props) {
  if (totalReviews === 0) {
    return (
      <View className="text-white/30 text-sm text-center py-4">
        <Text>Aucun avis pour le moment</Text></View>
    );
  }

  return (
    <View className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = ratings[star] || 0;
        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return (
          <View key={star} className="flex items-center gap-2">
            <Text className="text-white/40 text-xs w-4">{star}</Text>
            <Star
              size={10}
              className="text-yellow-400 flex-shrink-0"
              fill="currentColor"
            />
            <View className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
              <View
                className="h-full rounded-full bg-yellow-400"
                style={{ width: `${pct}%` }}
              />
            </View>
            <Text className="text-white/40 text-xs w-8 text-right">
              {count}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
