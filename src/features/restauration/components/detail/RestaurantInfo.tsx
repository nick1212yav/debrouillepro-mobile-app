import { View, Text } from "react-native";
import { Star } from "lucide-react-native";

interface RestaurantInfoProps {
  name: string;
  cuisine: string;
  description: string;
  rating: number;
  reviewsCount: number;
}

export function RestaurantInfo({
  name,
  cuisine,
  description,
  rating,
  reviewsCount,
}: RestaurantInfoProps) {
  return (
    <View className="px-4 pt-4 pb-2">
      <View className="flex justify-between items-start gap-4">
        <View>
          <Text className="text-2xl font-black tracking-tight text-white">
            {name}
          </Text>
          <Text className="text-orange-400 font-semibold text-xs mt-0.5">
            {cuisine}
          </Text>
        </View>
        <View className="flex flex-col items-end shrink-0">
          <View className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <Text className="text-amber-400 font-bold text-sm">
              {rating.toFixed(1)}
            </Text>
          </View>
          <Text className="text-[10px] text-white/40 mt-1">
            {reviewsCount} <Text>avis certifiés</Text></Text>
        </View>
      </View>

      <Text className="text-white/70 text-sm mt-3 leading-relaxed font-normal">
        {description}
      </Text>
    </View>
  );
}
