import { View, Text } from "react-native";
import React from "react";
import { Star, StarHalf } from "lucide-react-native";

interface RatingStarsProps {
  rating: number;
  count?: number;
  showText?: boolean;
  className?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  count,
  showText = true,
  className = "",
}) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4 && rating % 1 < 0.9;
  const totalStars = 5;

  return (
    <View className={`flex items-center gap-1.5 ${className}`}><View className="flex items-center">{Array.from({ length: totalStars }).map((_, index) => {
          if (index < fullStars) {
            return (
              <Star
                key={index}
                size={14}
                className="text-amber-400 fill-amber-400"
              />
            );
          } else if (index === fullStars && hasHalfStar) {
            return (
              <StarHalf
                key={index}
                size={14}
                className="text-amber-400 fill-amber-400"
              />
            );
          } else {
            return (
              <Star
                key={index}
                size={14}
                className="text-white/10 fill-white/5"
              />
            );
          }
        })}</View>{showText && (
        <View className="flex items-center gap-1 text-xs">
          <Text className="font-bold text-white">{rating.toFixed(1)}</Text>
          {count !== undefined && (
            <Text className="text-white/40">({count} avis)</Text>
          )}
        </View>
      )}</View>
  );
};
