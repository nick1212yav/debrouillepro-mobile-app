import { View, Text, Pressable } from "react-native";
import React from "react";
import { Share2, Heart, MapPin } from "lucide-react-native";
import { RatingStars } from "../common/RatingStars";
import type { Accommodation } from "../../types/accommodation.types";

interface AccommodationHeaderProps {
  accommodation: Accommodation;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export const AccommodationHeader: React.FC<AccommodationHeaderProps> = ({
  accommodation,
  isFavorite,
  onToggleFavorite,
  onShare,
}) => {
  const { title, type, location, rating, reviewsCount, tag } = accommodation;
  const locationLabel = location.district
    ? `${location.address ? location.address + ", " : ""}${location.district}, ${location.city}`
    : `${location.address ? location.address + ", " : ""}${location.city}`;

  return (
    <View className="flex flex-col gap-2 p-4 md:p-6 border-b border-white/5">
      <View className="flex items-center gap-2">
        <Text className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          {type}
        </Text>
        {tag && (
          <Text className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
            {tag}
          </Text>
        )}
      </View>

      <View className="flex items-start justify-between gap-4">
        <Text className="text-xl md:text-2xl font-bold text-white leading-tight">
          {title}
        </Text>
        <View className="flex items-center gap-2 shrink-0">
          <Pressable
            onPress={onShare}
           
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white"
          >
            <Share2 size={18} />
          </Pressable>
          <Pressable
            onPress={onToggleFavorite}
           
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white"
          >
            <Heart
              size={18}
              className={
                isFavorite ? "fill-rose-500 text-rose-500" : "text-white"
              }
            />
          </Pressable>
        </View>
      </View>

      <View className="flex flex-col sm:flex-row sm:items-center gap-3 mt-1 text-sm text-white/60">
        <View className="flex items-center gap-1.5">
          <MapPin size={16} className="text-white/40 shrink-0" />
          <Text>{locationLabel}</Text>
        </View>
        <View className="hidden sm:block text-white/20"><Text>•</Text></View>
        <RatingStars rating={rating} count={reviewsCount} />
      </View>
    </View>
  );
};
