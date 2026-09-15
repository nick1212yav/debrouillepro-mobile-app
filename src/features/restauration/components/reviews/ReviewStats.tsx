import { View, Text } from "react-native";
import { Star } from "lucide-react-native";
import type { ReviewStats as StatsType } from "../../types/review.types";

interface ReviewStatsProps {
  stats: StatsType;
}

export function ReviewStats({ stats }: ReviewStatsProps) {
  const distributionRows = [
    { star: 5, count: stats.ratingDistribution[5] },
    { star: 4, count: stats.ratingDistribution[4] },
    { star: 3, count: stats.ratingDistribution[3] },
    { star: 2, count: stats.ratingDistribution[2] },
    { star: 1, count: stats.ratingDistribution[1] },
  ];

  return (
    <View className="p-4 rounded-2xl flex flex-col sm:flex-row gap-5 items-center text-left bg-white/[0.01] border border-white/[0.04]">{}<View className="flex flex-col items-center text-center shrink-0"><Text className="text-3xl font-black text-white">{stats.averageRating.toFixed(1)}</Text><View className="flex gap-0.5 mt-1">{[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={11}
              className={
                i < Math.round(stats.averageRating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-white/10"
              }
            />
          ))}</View><Text className="text-[10px] text-white/30 uppercase font-bold tracking-wider mt-2">{stats.totalReviews}retours certifiés
        </Text></View>{}<View className="flex-1 w-full space-y-1.5 border-t sm:border-t-0 sm:border-l border-white/[0.06] pt-4 sm:pt-0 sm:pl-5">{distributionRows.map((row) => {
          const percent =
            stats.totalReviews > 0 ? (row.count / stats.totalReviews) * 100 : 0;
          return (
            <View key={row.star} className="flex items-center gap-3 text-xs"><Text className="w-3 text-white/40 text-right">{row.star}★</Text><View className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><View className="h-full bg-amber-400 rounded-full" style={{ width: `${percent}%` }} /></View><Text className="w-8 text-white/30 text-left font-mono">{percent.toFixed(0)}%
              </Text></View>
          );
        })}</View></View>
  );
}
