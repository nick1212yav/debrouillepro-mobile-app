import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportReviewStats.tsx
import { Star } from "lucide-react-native";

interface TransportReviewStatsProps {
  averageRating?: number;
  totalReviews?: number;
}

export function TransportReviewStats({
  averageRating = 4.8,
  totalReviews = 45,
}: TransportReviewStatsProps) {
  // Répartition simulée des étoiles d'évaluation
  const distribution = [
    { stars: 5, percentage: 80 },
    { stars: 4, percentage: 12 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 3 },
    { stars: 1, percentage: 0 },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Détails des évaluations [2]
      </Text><View className="flex items-center gap-6">{}<View className="text-center space-y-1"><Text className="text-3xl font-black text-white">{averageRating}</Text><View className="flex items-center justify-center gap-0.5 text-amber-400">{Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={
                  i < Math.round(averageRating)
                    ? "fill-amber-400"
                    : "text-white/20"
                }
              />
            ))}</View><Text className="text-[9px] text-white/40">{totalReviews}évaluations [2]
          </Text></View>{}<View className="flex-1 space-y-1.5">{distribution.map((dist) => (
            <View key={dist.stars} className="flex items-center gap-3 text-[10px] text-white/50"><Text className="w-2.5 text-right font-bold">{dist.stars}</Text><View className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden"><View className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full" style={{ width: `${dist.percentage}%` }} /></View><Text className="w-7 text-right font-bold">{dist.percentage}%
              </Text></View>
          ))}</View></View></View>
  );
}
