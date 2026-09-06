import { View, Text } from "react-native";
// src/features/sante/components/DoctorReviewStats.tsx
import type { Review } from "../types/review.types";

interface DoctorReviewStatsProps {
  reviews: Review[];
}

export function DoctorReviewStats({ reviews }: DoctorReviewStatsProps) {
  if (!reviews || reviews.length === 0) return null;

  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating - 1]++;
    }
  });

  const total = reviews.length;

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3">
        Répartition des notes
      </Text>
      <View className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star - 1] || 0;
          const percent = total > 0 ? (count / total) * 100 : 0;
          return (
            <View key={star} className="flex items-center gap-2">
              <Text className="text-xs text-white/40 w-4">{star}</Text>
              <View className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <View
                  className="h-full rounded-full bg-yellow-400"
                  style={{ width: `${percent}%` }}
                />
              </View>
              <Text className="text-xs text-white/30 w-8 text-right">
                {count}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
