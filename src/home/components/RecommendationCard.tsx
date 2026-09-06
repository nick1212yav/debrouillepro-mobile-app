import { View, Text, Pressable, Image } from "react-native";
import React from "react";

import type { RecommendationItem } from "../types/home-recommendation.types";

export interface RecommendationCardProps {
  item: RecommendationItem;

  onClick?: () => void;

  onAction?: (action: string) => void;

  compact?: boolean;
}

export function RecommendationCard({
  item,
  onClick,
  onAction,
  compact = false,
}: RecommendationCardProps) {
  return (
    <View
      className={`group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] ${
        compact ? "" : "shadow-xl shadow-black/10"
      }`}
    >
      {item.image && (
        <Pressable onPress={onClick} className="block w-full">
          <Image
           
           
            className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${
              compact ? "h-32" : "h-44"
            }`}
            loading="lazy"
           source={{ uri: item.image }} accessibilityLabel=""/>
        </Pressable>
      )}

      <View className="p-4">
        <View className="mb-2 flex items-center justify-between gap-3">
          <Text className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
            Recommandé
          </Text>

          <Text className="text-[11px] text-gray-500">
            {Math.round(Math.max(0, Math.min(100, item.score * 100)))}%
          </Text>
        </View>

        <Pressable onPress={onClick} className="w-full text-left">
          <Text className="text-sm font-bold text-white">
            {item.title}
          </Text>

          {item.description && (
            <Text className="mt-2 text-xs leading-5 text-gray-400">
              {item.description}
            </Text>
          )}
        </Pressable>

        {item.reason && (
          <Text className="mt-3 text-xs text-blue-300/80">{item.reason}</Text>
        )}

        <View className="mt-4 flex items-center gap-2">
          <Pressable
            type="button"
            onPress={onClick}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-3 py-2.5 text-xs font-semibold text-white"
          >
            <Text>Voir</Text></Pressable>

          {onAction && (
            <Pressable
              type="button"
              onPress={() => onAction("save")}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-gray-300"
              accessibilityLabel="Enregistrer"
            >
              <Text>♡</Text></Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default RecommendationCard;
