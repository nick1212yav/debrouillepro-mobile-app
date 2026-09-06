import { View, Text, Pressable, Image, GestureResponderEvent } from "react-native";
import React from "react";
import { Heart, MapPin } from "lucide-react-native";
import { RatingStars } from "../common/RatingStars";
import { PriceRange } from "../common/PriceRange";
import { RoomBadge } from "../common/RoomBadge";
import type { Accommodation } from "../../types/accommodation.types";

interface AccommodationCardProps {
  accommodation: Accommodation;
  isFavorite?: boolean;
  onToggleFavorite?: (e: GestureResponderEvent) => void;
  onSelect?: () => void;
  className?: string;
}

export const AccommodationCard: React.FC<AccommodationCardProps> = ({
  accommodation,
  isFavorite = false,
  onToggleFavorite,
  onSelect,
  className = "",
}) => {
  const {
    title,
    type,
    location,
    pricing,
    rooms,
    area,
    images,
    rating,
    reviewsCount,
    available,
    tag,
  } = accommodation;

  const displayImage =
    images && images.length > 0
      ? images[0]
      : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80";

  const locationLabel = location.district
    ? `${location.district}, ${location.city}`
    : location.city;

  return (
    <Pressable
      onPress={onSelect}
      className={`group rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl bg-white/5 border border-white/8 ${className}`}
      style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", borderColor: "rgba(255, 255, 255, 0.08)" }}
    >
      {/* Image & Badges */}
      <View className="relative aspect-video w-full overflow-hidden">
        <Image
         
         
          className="w-full h-full object-cover"
          loading="lazy"
         source={{ uri: displayImage }} accessibilityLabel={title}/>
        <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Floating Tag */}
        {tag && (
          <View className="absolute top-3 left-3 z-10">
            <Text
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
              style={{ backgroundColor: "rgba(99, 102, 241, 0.85)" }}
            >
              {tag}
            </Text>
          </View>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <Pressable
            onPress={(e) => {
              onToggleFavorite(e);
            }}
           
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-xl flex items-center justify-center bg-black/40 border border-white/10"
          >
            <Heart
              size={16}
              className={
                isFavorite
                  ? "fill-rose-500 text-rose-500"
                  : "text-white transition-colors group-hover:text-rose-400"
              }
            />
          </Pressable>
        )}

        {/* Availability Badge Overlay */}
        {!available && (
          <View className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Text className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-extrabold text-sm uppercase tracking-wider">
              Indisponible
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-4 flex flex-col gap-3">
        <View className="flex items-start justify-between gap-2">
          <View className="flex flex-col gap-1">
            <Text className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
              {type}
            </Text>
            <Text className="text-white font-semibold text-sm">
              {title}
            </Text>
            <View className="flex items-center gap-1 text-white/50">
              <MapPin size={12} className="text-white/30 shrink-0" />
              <Text className="text-xs truncate">{locationLabel}</Text>
            </View>
          </View>

          {/* Price Component */}
          <PriceRange
            amount={pricing.amount}
            period={pricing.period}
            currency={pricing.currency || "FCFA"}
            size="sm"
            className="shrink-0 text-right"
          />
        </View>

        {/* Specifications Badges & Rating */}
        <View className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
          <View className="flex items-center gap-1.5 flex-wrap">
            {rooms.bedrooms > 0 && (
              <RoomBadge type="bedrooms" value={rooms.bedrooms} />
            )}
            {rooms.bathrooms > 0 && (
              <RoomBadge type="baths" value={rooms.bathrooms} />
            )}
            {area && area > 0 && <RoomBadge type="area" value={area} />}
          </View>

          <RatingStars rating={rating} showText={false} className="shrink-0" />
        </View>
      </View>
    </Pressable>
  );
};
