import { View } from "react-native";
// src/features/agri/components/card/AgriCardSkeleton.tsx
export function AgriCardSkeleton() {
  return (
    <View className="w-full rounded-[24px] overflow-hidden bg-white/[0.02] border border-white/5 p-1 animate-pulse">
      {/* Squelette de l'image */}
      <View className="aspect-[4/3] w-full rounded-[20px] bg-white/[0.03]" />

      {/* Squelette des textes */}
      <View className="p-3.5 space-y-3">
        <View className="h-3.5 bg-white/[0.04] rounded-lg w-3/4" />
        <View className="space-y-1.5">
          <View className="h-2.5 bg-white/[0.03] rounded-lg w-full" />
          <View className="h-2.5 bg-white/[0.03] rounded-lg w-5/6" />
        </View>

        {/* Squelette du pied de carte */}
        <View className="flex justify-between items-center pt-2">
          <View className="h-4 bg-white/[0.04] rounded-lg w-1/3" />
          <View className="h-3.5 bg-white/[0.03] rounded-full w-8" />
        </View>
      </View>
    </View>
  );
}
