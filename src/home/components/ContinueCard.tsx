import { View, Text, Pressable, Image } from "react-native";
import React from "react";

import type { RecommendationItem } from "../types/home-recommendation.types";

export interface ContinueCardProps {
  item: RecommendationItem;

  onClick?: () => void;

  onAction?: (action: string) => void;
}

export function ContinueCard({ item, onClick, onAction }: ContinueCardProps) {
  const progress =
    typeof (
      item as unknown as {
        progress?: number;
      }
    ).progress === "number"
      ? Math.max(
          0,
          Math.min(
            100,
            (
              item as unknown as {
                progress: number;
              }
            ).progress,
          ),
        )
      : undefined;

  return (
    <View className="overflow-hidden rounded-2xl border border-violet-400/10 bg-white/5">
      <View className="flex gap-4 p-4">
        {item.image ? (
          <Pressable onPress={onClick} className="shrink-0">
            <Image
             
             
              className="h-20 w-20 rounded-xl object-cover"
              loading="lazy"
             source={{ uri: item.image }} accessibilityLabel=""/>
          </Pressable>
        ) : (
          <Pressable
           
            onPress={onClick}
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-2xl"
          >
            <Text>▶</Text></Pressable>
        )}

        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-semibold text-violet-300">
            Continuer
          </Text>

          <Pressable
           
            onPress={onClick}
            className="mt-1 block w-full text-left"
          >
            <Text className="text-sm font-bold text-white">
              {item.title}
            </Text>
          </Pressable>

          {item.description && (
            <Text className="mt-1 text-xs text-gray-400">
              {item.description}
            </Text>
          )}
        </View>
      </View>

      {progress !== undefined && (
        <View className="px-4 pb-4">
          <View className="mb-1 flex items-center justify-between text-[10px] text-gray-500">
            <Text>Progression</Text>

            <Text>{Math.round(progress)}%</Text>
          </View>

          <View className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <View
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </View>
        </View>
      )}

      {onAction && (
        <View className="border-t border-white/5 px-4 py-3">
          <Pressable
            onPress={() => onAction("continue")}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2.5 text-xs font-semibold text-white"
          >
            <Text>Continuer</Text></Pressable>
        </View>
      )}
    </View>
  );
}

export default ContinueCard;
