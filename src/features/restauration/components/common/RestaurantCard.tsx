import { View, Image, Pressable, Text, GestureResponderEvent } from "react-native";
import { Star, Clock, Heart, Shield } from "lucide-react-native";
import type { RestaurantDetail } from "../../types/restaurant.types";
import { RatingStars } from "./RatingStars";
import { CuisineTag } from "./CuisineTag";

interface RestaurantCardProps {
  restaurant: RestaurantDetail;
  isFavorite: boolean;
  onToggleFavorite: (e: GestureResponderEvent) => void;
  onSelect?: (id: number) => void;
}

export function RestaurantCard({
  restaurant,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: RestaurantCardProps) {
  return (
    <View onPress={() => onSelect?.(restaurant.id)} className={`rounded-2xl overflow-hidden text-left bg-white/[0.03] border border-white/[0.06] ${
        onSelect ? "cursor-pointer hover:bg-white/[0.05] transition-all" : ""
      }`}><View className="relative h-40"><Image className="w-full h-full object-cover" source={{ uri: restaurant.image }} accessibilityLabel={restaurant.name} /><View className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />{}<Pressable onPress={onToggleFavorite} className="absolute top-3 right-3 w-8.5 h-8.5 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90" style={{ backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }}><Heart size={15} className={
              isFavorite ? "fill-rose-500 text-rose-500" : "text-white"
            } /></Pressable>{!restaurant.open && (
          <View className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-xs"><Text className="px-4 py-1.5 rounded-full bg-rose-500/80 text-white text-xs font-black uppercase tracking-wider">Fermé actuellement
            </Text></View>
        )}<View className="absolute top-3 left-3 flex gap-1">{restaurant.tags.slice(0, 1).map((tag) => (
            <Text key={tag} className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white bg-orange-500/90 shadow">{tag}</Text>
          ))}</View></View><View className="p-4 space-y-3"><View className="flex justify-between items-start gap-2"><View className="min-w-0"><Text className="font-extrabold text-sm text-white truncate">{restaurant.name}</Text><View className="flex items-center gap-1.5 mt-0.5"><CuisineTag cuisine={restaurant.cuisine} /><Text className="text-[10px] text-white/35">•</Text><Text className="text-[10px] text-white/50 truncate max-w-[120px]">{restaurant.location}</Text></View></View><View className="flex flex-col items-end shrink-0"><View className="flex items-center gap-0.5"><Star size={12} className="text-amber-400 fill-amber-400" /><Text className="text-xs font-black text-white">{restaurant.rating.toFixed(1)}</Text></View><Text className="text-[9px] text-white/35 font-medium mt-0.5">{restaurant.reviewsCount}avis
            </Text></View></View><View className="flex justify-between items-center text-[10px] text-white/45 pt-2.5 border-t border-white/[0.04]"><View className="flex items-center gap-1"><Clock size={12} className="text-orange-400/80" /><Text className="font-semibold text-white/85">{restaurant.deliveryTime}</Text></View><Text className="font-bold">Min. {restaurant.minOrder.toLocaleString()}FCFA
          </Text></View></View></View>
  );
}
