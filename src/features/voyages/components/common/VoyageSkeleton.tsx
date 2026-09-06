import { View } from "react-native";
// src/features/voyages/components/common/VoyageSkeleton.tsx
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface VoyageSkeletonProps {
  variant?: "card" | "detail" | "list";
  className?: string;
}

export function VoyageSkeleton({
  variant = "card",
  className,
}: VoyageSkeletonProps) {
  if (variant === "detail") {
    return (
      <View className={cn("space-y-6", className)}>
        <Skeleton className="h-72 w-full rounded-3xl" />
        <View className="space-y-4 px-4">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
          <Skeleton className="h-6 w-1/3 rounded-lg" />
          <View className="gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </View>
        </View>
      </View>
    );
  }

  if (variant === "list") {
    return (
      <View
        className={cn(
          "flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10",
          className,
        )}
      >
        <Skeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
        <View className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
          <Skeleton className="h-3 w-1/3 rounded-lg" />
          <View className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </View>
        </View>
        <View className="text-right space-y-1">
          <Skeleton className="h-5 w-20 rounded-lg ml-auto" />
          <Skeleton className="h-3 w-16 rounded-lg ml-auto" />
        </View>
      </View>
    );
  }

  // Default: card skeleton
  return (
    <View
      className={cn(
        "rounded-3xl overflow-hidden bg-white/5 border border-white/10",
        className,
      )}
    >
      <Skeleton className="aspect-[4/3] w-full" />
      <View className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3 w-full rounded-lg" />
        <Skeleton className="h-3 w-2/3 rounded-lg" />
        <View className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-1/3 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </View>
      </View>
    </View>
  );
}
