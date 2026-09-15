import { View } from "react-native";
import React from "react";

interface AccommodationCardSkeletonProps {
  className?: string;
}

export const AccommodationCardSkeleton: React.FC<
  AccommodationCardSkeletonProps
> = ({ className = "" }) => {
  return (
    <View className={`rounded-2xl overflow-hidden bg-white/5 border border-white/8 animate-pulse ${className}`} style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", borderColor: "rgba(255, 255, 255, 0.08)" }}>{}<View className="relative aspect-video w-full bg-white/5" />{}<View className="p-4 flex flex-col gap-3"><View className="flex items-start justify-between gap-4"><View className="flex-1 flex flex-col gap-2">{}<View className="h-3 w-1/4 rounded bg-white/10" />{}<View className="h-4 w-3/4 rounded bg-white/10" />{}<View className="h-3 w-1/2 rounded bg-white/10" /></View>{}<View className="h-8 w-20 rounded bg-white/10 shrink-0" /></View>{}<View className="flex items-center justify-between gap-4 pt-3 border-t border-white/5"><View className="flex items-center gap-1.5 flex-1"><View className="h-6 w-12 rounded bg-white/10" /><View className="h-6 w-12 rounded bg-white/10" /><View className="h-6 w-12 rounded bg-white/10" /></View><View className="h-4 w-12 rounded bg-white/10 shrink-0" /></View></View></View>
  );
};
