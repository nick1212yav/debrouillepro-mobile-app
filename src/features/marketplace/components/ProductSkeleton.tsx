import { View } from "react-native";

// src/features/marketplace/components/ProductSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function ProductSkeleton() {
  return (
    <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Skeleton className="aspect-square w-full rounded-none" /><View className="p-3 space-y-2"><Skeleton className="h-4 w-3/4 rounded-lg" /><Skeleton className="h-5 w-1/2 rounded-lg" /><Skeleton className="h-3 w-1/3 rounded-lg" /></View></View>
  );
}
