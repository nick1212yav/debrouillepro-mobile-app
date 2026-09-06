import { View } from "react-native";
import { Star } from "lucide-react-native";

interface RatingStarsProps {
  rating: number;
}

export function RatingStars({ rating }: RatingStarsProps) {
  const score = Math.round(rating);

  return (
    <View className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={11}
          className={
            i < score ? "text-amber-400 fill-amber-400" : "text-white/10"
          }
        />
      ))}
    </View>
  );
}
