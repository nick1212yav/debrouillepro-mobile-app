import { View, Text } from "react-native";

// src/features/voyages/components/common/VoyageRating.tsx
import { Star, StarHalf } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface VoyageRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { star: 14, text: "text-xs" },
  md: { star: 16, text: "text-sm" },
  lg: { star: 20, text: "text-base" },
};

export function VoyageRating({
  rating,
  reviewCount,
  size = "md",
  showCount = true,
  className,
}: VoyageRatingProps) {
  const { star: starSize, text: textSize } = sizeMap[size];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <View className={cn("flex items-center gap-1.5", className)}><View className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) {
            return (
              <Star
                key={i}
                size={starSize}
                className="fill-amber-400 text-amber-400"
              />
            );
          }
          if (i === fullStars && hasHalfStar) {
            return (
              <StarHalf
                key={i}
                size={starSize}
                className="fill-amber-400 text-amber-400"
              />
            );
          }
          return <Star key={i} size={starSize} className="text-white/20" />;
        })}</View><Text className={cn("text-white font-medium", textSize)}>{rating.toFixed(1)}</Text>{showCount && reviewCount !== undefined && (
        <Text className={cn("text-white/40", textSize)}>({reviewCount})</Text>
      )}</View>
  );
}
