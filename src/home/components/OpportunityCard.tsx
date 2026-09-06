import { View, Text, Pressable, Image } from "react-native";
import React from "react";

import type { RecommendationItem } from "../types/home-recommendation.types";

export interface OpportunityCardProps {
  item: RecommendationItem;

  onClick?: () => void;

  onAction?: (action: string) => void;
}

export function OpportunityCard({
  item,
  onClick,
  onAction,
}: OpportunityCardProps) {
  return (
    <View className="group overflow-hidden rounded-2xl border border-amber-400/10 bg-white/5">
      <View className="relative">
        {item.image ? (
          <Pressable onPress={onClick} className="block w-full">
            <Image
             
             
              className="h-40 w-full object-cover"
              loading="lazy"
             source={{ uri: item.image }} accessibilityLabel=""/>
          </Pressable>
        ) : (
          <View className="flex h-40 items-center justify-center bg-gradient-to-br from-amber-500/10 to-orange-500/5 text-4xl">
            <Text>🚀</Text></View>
        )}

        <Text className="absolute left-3 top-3 rounded-full border border-amber-400/20 bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
          Opportunité
        </Text>
      </View>

      <View className="p-4">
        <Text className="text-sm font-bold text-white">
          {item.title}
        </Text>

        {item.description && (
          <Text className="mt-2 text-xs leading-5 text-gray-400">
            {item.description}
          </Text>
        )}

        <View className="mt-4 flex gap-2">
          <Pressable
            onPress={onClick}
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2.5 text-xs font-bold text-white"
          >
            <Text>Découvrir</Text></Pressable>

          {onAction && (
            <Pressable
              onPress={() => onAction("save")}
              className="rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-gray-300"
            >
              <Text>♡</Text></Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default OpportunityCard;
