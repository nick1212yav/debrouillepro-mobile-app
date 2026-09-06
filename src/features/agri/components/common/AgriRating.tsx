import { Text, View } from "react-native";

// src/features/agri/components/common/AgriRating.tsx
import { Star } from "lucide-react-native";

interface AgriRatingProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export function AgriRating({
  rating,
  reviewCount,
  className = "",
}: AgriRatingProps) {
  return (
    <View
      className={`flex items-center gap-1 text-[10px] text-white/60 ${className}`}
    >
      <Star
        size={11}
        className="fill-yellow-500 text-yellow-500 flex-shrink-0"
      />
      <Text className="font-bold text-white/80">{rating.toFixed(1)}</Text>
      {reviewCount !== undefined && (
        <Text className="text-white/30">({reviewCount})</Text>
      )}
    </View>
  );
}
