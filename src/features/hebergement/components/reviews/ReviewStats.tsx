import { View, Text } from "react-native";
import React from "react";
import { Star } from "lucide-react-native";

interface ReviewStatsProps {
  rating: number;
  totalCount: number;
  className?: string;
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({
  rating,
  totalCount,
  className = "",
}) => {
  const starBreakdown = [
    { stars: 5, percentage: 75 },
    { stars: 4, percentage: 15 },
    { stars: 3, percentage: 7 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 },
  ];

  return (
    <View
      className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row gap-5 items-center sm:items-stretch ${className}`}
    >
      <View className="flex flex-col items-center justify-center p-3 text-center sm:border-r sm:border-white/5 sm:pr-5 shrink-0">
        <Text className="text-4xl font-black text-white">
          {rating.toFixed(1)}
        </Text>
        <View className="flex gap-0.5 my-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={
                i < Math.round(rating)
                  ? "text-amber-400 fill-amber-400"
                  : "text-white/10"
              }
            />
          ))}
        </View>
        <Text className="text-[10px] text-white/40 font-semibold uppercase tracking-wider mt-0.5">
          {totalCount} avis voyageurs
        </Text>
      </View>

      <View className="flex-1 flex flex-col gap-2.5 justify-center w-full">
        {starBreakdown.map((item) => (
          <View key={item.stars} className="flex items-center gap-3 text-xs">
            <Text className="w-3 text-white/50 text-right font-medium">
              {item.stars}
            </Text>
            <View className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <View
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                style={{ width: `${item.percentage}%` }}
              />
            </View>
            <Text className="w-8 text-white/40 text-right font-medium">
              {item.percentage}<Text>%</Text></Text>
          </View>
        ))}
      </View>
    </View>
  );
};
