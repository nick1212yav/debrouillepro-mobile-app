import { View } from "react-native";
// src/features/transport/placeholders.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function RouteCardSkeleton() {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex flex-col gap-4">
      <View className="flex items-start justify-between">
        <View className="flex gap-3 w-full">
          <Skeleton className="w-10 h-10 rounded-2xl bg-white/5 flex-shrink-0" />
          <View className="space-y-2 flex-1">
            <Skeleton className="h-4 w-2/3 bg-white/5 rounded-lg" />
            <Skeleton className="h-3 w-1/3 bg-white/5 rounded-lg" />
          </View>
        </View>
        <Skeleton className="h-5 w-16 bg-white/5 rounded-lg" />
      </View>
      <View className="flex items-center justify-between border-t border-white/5 pt-3">
        <Skeleton className="h-3.5 w-24 bg-white/5 rounded-lg" />
        <Skeleton className="h-3.5 w-16 bg-white/5 rounded-lg" />
      </View>
    </View>
  );
}

export function DriverProfileSkeleton() {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-2xl bg-white/5" />
      <View className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2 bg-white/5 rounded-lg" />
        <Skeleton className="h-3.5 w-1/3 bg-white/5 rounded-lg" />
      </View>
      <View className="flex items-center gap-1.5">
        <Skeleton className="w-10 h-10 rounded-xl bg-white/5" />
        <Skeleton className="w-10 h-10 rounded-xl bg-white/5" />
      </View>
    </View>
  );
}
