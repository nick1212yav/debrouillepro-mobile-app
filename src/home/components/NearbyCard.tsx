import { Pressable, View, Text, Image } from "react-native";
import React from "react";

import type { RecommendationItem } from "../types/home-recommendation.types";

export interface NearbyCardProps {
  item: RecommendationItem;

  onClick?: () => void;

  onAction?: (action: string) => void;
}

function formatDistance(distance?: number): string | null {
  if (typeof distance !== "number") {
    return null;
  }

  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${(distance / 1000).toFixed(1)} km`;
}

export function NearbyCard({ item, onClick, onAction }: NearbyCardProps) {
  const distance = formatDistance(item.distanceKm);

  return (
    <View className="group overflow-hidden rounded-2xl border border-emerald-400/10 bg-white/5 backdrop-blur-xl transition">
      <Pressable onPress={onClick} className="block w-full text-left">
        <View className="relative">
          {item.image ? (
            <Image className="h-36 w-full object-cover"  source={{ uri: item.image }} accessibilityLabel="" />
          ) : (
            <View className="flex h-36 items-center justify-center bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 text-4xl">
              📍
            </View>
          )}

          {distance && (
            <Text className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              {distance}
            </Text>
          )}
        </View>

        <View className="p-4">
          <Text className="text-[11px] font-medium text-emerald-300">
            À proximité
          </Text>

          <Text className="mt-1 text-sm font-bold text-white">{item.title}</Text>

          {item.description && (
            <Text className="mt-2 text-xs text-gray-400">
              {item.description}
            </Text>
          )}
        </View>
      </Pressable>

      {onAction && (
        <View className="px-4 pb-4">
          <Pressable onPress={() => onAction("directions")} className="w-full rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-300 transition">
            Voir à proximité
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default NearbyCard;
